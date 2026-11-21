import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function privateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function privateIpv6(ip: string) {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true;
  if (v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
  if (v.startsWith("fc") || v.startsWith("fd")) return true;
  if (v.startsWith("::ffff:")) return privateIpv4(v.slice(7));
  return false;
}

export async function assertPublicHttpUrl(raw: string | URL) {
  let url: URL;
  try {
    url = typeof raw === "string" ? new URL(raw) : raw;
  } catch {
    throw new Error("URL 格式不正确");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("仅支持 http/https 地址");
  if (url.username || url.password) throw new Error("URL 不能包含账号密码");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("不允许访问内网地址");
  }
  if (isIP(host)) {
    if (isIP(host) === 4 && privateIpv4(host)) throw new Error("不允许访问内网地址");
    if (isIP(host) === 6 && privateIpv6(host)) throw new Error("不允许访问内网地址");
    return url;
  }
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length) throw new Error("域名无法解析");
  for (const addr of addresses) {
    if (addr.family === 4 && privateIpv4(addr.address)) throw new Error("不允许访问内网地址");
    if (addr.family === 6 && privateIpv6(addr.address)) throw new Error("不允许访问内网地址");
  }
  return url;
}

export async function safeFetch(input: string | URL, init: RequestInit = {}) {
  let current = new URL(typeof input === "string" ? input : input.toString());
  for (let i = 0; i < 4; i++) {
    await assertPublicHttpUrl(current);
    const res = await fetch(current, { ...init, redirect: "manual" });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) return res;
      current = new URL(location, current);
      continue;
    }
    return res;
  }
  throw new Error("重定向次数过多");
}
