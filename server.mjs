import http from "node:http";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import next from "next";
import { createClient } from "redis";

try {
  process.loadEnvFile?.(".env");
} catch {}

if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";

const PORT = Number(process.env.PORT || "3060");
const HOST = process.env.HOST || "0.0.0.0";
const REDIS_URL = process.env.REDIS_URL || "";
const HTML_TTL = Math.max(10, Number(process.env.HTML_CACHE_SECONDS || "300"));
const HTML_STALE_TTL = Math.max(30, Number(process.env.HTML_STALE_SECONDS || "120"));
const gzipAsync = promisify(gzip);

const BUILD_ID = (() => {
  try {
    return readFileSync(".next/BUILD_ID", "utf8").trim() || "dev";
  } catch {
    return "dev";
  }
})();
const PREFIX = `mac:cms:html:${BUILD_ID}:`;
const VERSION_KEY = "mac:cms:htmlver";
const EXTRA_KEY = "mac:cms:extra";
const ADMIN_PATH_KEY = "mac:cms:admin-path";
const RESERVED_ADMIN_PATHS = ["/api", "/api.php", "/vod", "/user", "/art", "/topic", "/map", "/label", "/search", "/gbook", "/website", "/manga", "/actor", "/role", "/rss", "/media", "/player", "/theme", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml"];
let adminPathCache = { value: "/admin", at: 0 };
const MAX_BODY = 768 * 1024;

const SKIP_PREFIXES = ["/admin", "/api", "/user", "/media", "/player", "/_next", "/theme", "/rss"];

let redis = null;

async function initRedis() {
  if (!REDIS_URL) return;
  const client = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: 800,
      reconnectStrategy: (retries) => (retries > 5 ? false : Math.min(1000, 100 * retries)),
    },
  });
  client.on("error", () => {});
  try {
    await client.connect();
    redis = client;
    console.log("[cache] redis connected");
  } catch {
    console.warn("[cache] redis unavailable, running without page cache");
  }
}

function isCacheable(req, url) {
  if (!redis?.isReady) return false;
  if (req.method !== "GET") return false;
  if (!/text\/html/i.test(req.headers.accept || "")) return false;
  if (req.headers.rsc || req.headers["next-router-state-tree"] || req.headers["next-router-prefetch"]) return false;
  if (req.headers.authorization) return false;
  if (/no-cache|no-store/i.test(req.headers["cache-control"] || "")) return false;
  const cookie = req.headers.cookie || "";
  if (/(?:^|;\s*)(?:mac_user|mac_admin)=/.test(cookie)) return false;
  const path = url.pathname;
  if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  if (path === "/favicon.ico" || path === "/favicon.png") return false;
  return true;
}

function normalizeAdminPath(value) {
  let path = String(value || "").trim();
  if (!path) return "/admin";
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+$/, "");
  if (!/^\/[A-Za-z0-9_-]{2,32}$/.test(path)) return "/admin";
  if (RESERVED_ADMIN_PATHS.some((reserved) => path === reserved || path.startsWith(`${reserved}/`))) return "/admin";
  return path;
}

async function getAdminPath() {
  if (!redis?.isReady) return "/admin";
  if (Date.now() - adminPathCache.at < 1000) return adminPathCache.value;
  let value = "/admin";
  try {
    const raw = await redis.get(ADMIN_PATH_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        value = normalizeAdminPath(typeof parsed === "string" ? parsed : raw);
      } catch {
        value = normalizeAdminPath(raw);
      }
    }
  } catch {}
  adminPathCache = { value, at: Date.now() };
  return value;
}

async function extraAllowsCache() {
  if (!redis?.isReady) return false;
  try {
    const raw = await redis.get(EXTRA_KEY);
    if (!raw) return false;
    const extra = JSON.parse(raw);
    return !extra?.safety?.ipBlacklist;
  } catch {
    return false;
  }
}

function cacheKey(req, url, version) {
  const host = req.headers.host || "localhost";
  const digest = createHash("sha1").update(`${host}|${url.pathname}${url.search}`).digest("hex");
  return `${PREFIX}${version}:${digest}`;
}

function toBuffer(chunk, encoding) {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (typeof chunk === "string") return Buffer.from(chunk, encoding === "latin1" ? "latin1" : "utf8");
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);
  return null;
}

function safeHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (key === "set-cookie" || key === "connection" || key === "transfer-encoding" || key === "content-length") continue;
    if (key === "content-encoding" || key === "date") continue;
    out[key] = value;
  }
  return out;
}

async function storeResponse(key, status, headers, chunks) {
  const body = Buffer.concat(chunks);
  const now = Date.now();
  let gz = null;
  try {
    gz = await gzipAsync(body, { level: 6 });
  } catch {}
  const payload = JSON.stringify({
    status,
    headers: safeHeaders(headers),
    body: body.toString("base64"),
    gzip: gz ? gz.toString("base64") : null,
    freshUntil: now + HTML_TTL * 1000,
    staleUntil: now + (HTML_TTL + HTML_STALE_TTL) * 1000,
  });
  try {
    await redis.set(key, payload, { EX: HTML_TTL + HTML_STALE_TTL + 60 });
  } catch {}
}

const refreshing = new Set();

function kickRefresh(req, url) {
  const host = req.headers.host || "localhost";
  const path = `${url.pathname}${url.search}`;
  const id = `${host}|${path}`;
  if (refreshing.has(id)) return;
  refreshing.add(id);
  const request = http.request(
    {
      hostname: "127.0.0.1",
      port: PORT,
      path,
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        Host: host,
        "User-Agent": "mac-cms-refresh",
        "x-cache-refresh": "1",
      },
    },
    (res) => {
      res.resume();
      res.on("end", () => refreshing.delete(id));
      res.on("error", () => refreshing.delete(id));
    },
  );
  request.on("error", () => refreshing.delete(id));
  request.on("close", () => refreshing.delete(id));
  request.setTimeout(15000, () => request.destroy());
  request.end();
}

async function handler(req, res, handle) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const adminPath = await getAdminPath();
  const path = url.pathname;
  let adminRoute = false;
  if (adminPath !== "/admin" && (path === adminPath || path.startsWith(`${adminPath}/`))) {
    req.url = `/admin${path.slice(adminPath.length)}${url.search}`;
    adminRoute = true;
  } else if (adminPath !== "/admin" && (path === "/admin" || path.startsWith("/admin/"))) {
    const target = `${adminPath}${path.slice("/admin".length)}${url.search}`;
    res.writeHead(307, { Location: target, "Cache-Control": "no-store" });
    res.end();
    return;
  }

  let key = null;
  let cacheable = false;
  let version = "0";
  const refreshRequest = req.headers["x-cache-refresh"] === "1";

  if (!adminRoute && isCacheable(req, url)) {
    if (await extraAllowsCache()) {
      try {
        version = (await redis.get(VERSION_KEY)) || "0";
        key = cacheKey(req, url, version);
        const raw = !refreshRequest ? await redis.get(key) : null;
        if (raw) {
          const now = Date.now();
          const cached = JSON.parse(raw);
          const freshUntil = Number(cached.freshUntil) || 0;
          const staleUntil = Number(cached.staleUntil) || 0;
          const isFresh = freshUntil ? now < freshUntil : true;
          const isUsable = staleUntil ? now < staleUntil : true;
          if (isFresh || isUsable) {
            const stale = !isFresh;
            const useGzip = /gzip/i.test(req.headers["accept-encoding"] || "") && Boolean(cached.gzip);
            const body = Buffer.from(useGzip ? cached.gzip : cached.body, "base64");
            const headers = {
              ...cached.headers,
              "content-length": String(body.length),
              "cache-control": `public, max-age=0, s-maxage=${HTML_TTL}`,
              "x-cache": stale ? "STALE" : "HIT",
            };
            if (useGzip) headers["content-encoding"] = "gzip";
            else delete headers["content-encoding"];
            const vary = String(headers.vary || "");
            if (!/accept-encoding/i.test(vary)) {
              headers.vary = vary ? `${vary}, Accept-Encoding` : "Accept-Encoding";
            }
            if (stale) kickRefresh(req, url);
            else void redis.expire(key, HTML_TTL + HTML_STALE_TTL + 60).catch(() => {});
            res.writeHead(cached.status || 200, headers);
            res.end(body);
            return;
          }
          void redis.del(key).catch(() => {});
        }
      } catch {}
      cacheable = true;
    }
  }

  if (!cacheable) {
    await handle(req, res);
    return;
  }

  req.headers["accept-encoding"] = "identity";

  const chunks = [];
  let size = 0;
  let overflow = false;
  const origWrite = res.write;
  const origEnd = res.end;

  res.write = function (chunk, encoding, callback) {
    const buf = toBuffer(chunk, encoding);
    if (buf) {
      if (size + buf.length <= MAX_BODY) {
        chunks.push(buf);
        size += buf.length;
      } else {
        overflow = true;
      }
    }
    return origWrite.call(res, chunk, encoding, callback);
  };

  res.end = function (chunk, encoding, callback) {
    const buf = toBuffer(chunk, encoding);
    if (buf) {
      if (size + buf.length <= MAX_BODY) {
        chunks.push(buf);
        size += buf.length;
      } else {
        overflow = true;
      }
    }
    if (!overflow && key) {
      const headers = res.getHeaders();
      const type = String(headers["content-type"] || "");
      if (res.statusCode === 200 && /text\/html/i.test(type) && !headers["set-cookie"]) {
        void storeResponse(key, res.statusCode, headers, chunks);
      }
    }
    return origEnd.call(res, chunk, encoding, callback);
  };

  try {
    await handle(req, res);
  } finally {
    res.write = origWrite;
    res.end = origEnd;
  }
}

let cronRunning = false;

function triggerInternalCron() {
  const secret = process.env.CRON_SECRET;
  if (cronRunning || !secret || process.env.INTERNAL_CRON === "0") return;
  cronRunning = true;
  const req = http.request(
    {
      hostname: "127.0.0.1",
      port: PORT,
      path: "/api/cron",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "2",
        "x-cron-secret": secret,
        Host: process.env.WARM_HOST || "localhost",
      },
    },
    (res) => {
      res.resume();
      res.on("end", () => { cronRunning = false; });
      res.on("error", () => { cronRunning = false; });
    },
  );
  req.on("error", () => { cronRunning = false; });
  req.on("close", () => { cronRunning = false; });
  req.setTimeout(280000, () => req.destroy());
  req.end("{}");
}

function warmPath(path, host) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          Host: host,
          "User-Agent": "mac-cms-warmer",
        },
      },
      (res) => {
        res.resume();
        res.on("end", resolve);
        res.on("error", resolve);
      },
    );
    req.on("error", resolve);
    req.setTimeout(15000, () => {
      req.destroy();
      resolve();
    });
    req.end();
  });
}

async function warmPages() {
  if (!redis?.isReady || process.env.WARM_PAGES === "0") return;
  const host = process.env.WARM_HOST || "localhost";
  const paths = [
    "/",
    "/map",
    "/label/rank",
    "/label/update",
    "/topic",
    "/vod/search",
    "/vod/type/1",
    "/vod/type/2",
    "/vod/type/3",
    "/vod/type/4",
    "/vod/type/36",
  ];
  for (const path of [...paths, "/"]) await warmPath(path, host);
  try {
    const raw = await redis.get("mac:cms:settings");
    const settings = raw ? JSON.parse(raw) : null;
    const hot = String(settings?.site?.search_hot || "")
      .split(/[,，]/)
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 5);
    for (const word of hot) {
      await warmPath(`/vod/search?wd=${encodeURIComponent(word)}`, host);
    }
  } catch {}
  console.log(`[cache] warmed ${paths.length + 1} pages for ${host}`);
}

async function main() {
  const app = next({ dev: false, dir: process.cwd(), hostname: HOST, port: PORT });
  await app.prepare();
  await initRedis();
  const handle = app.getRequestHandler();

  const server = http.createServer((req, res) => {
    handler(req, res, handle).catch((err) => {
      console.error("[server]", err);
      if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`[server] listening on ${HOST}:${PORT}`);
    setTimeout(() => {
      warmPages().catch(() => {});
    }, 100).unref();
    setInterval(() => {
      warmPages().catch(() => {});
    }, Math.max(60, Math.floor(HTML_TTL * 0.8)) * 1000).unref();
    setTimeout(() => {
      triggerInternalCron();
      setInterval(triggerInternalCron, 60_000).unref();
    }, 5000).unref();
  });

  const shutdown = () => {
    server.close(() => {
      const closing = app.close ? app.close() : Promise.resolve();
      Promise.resolve(closing).finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});