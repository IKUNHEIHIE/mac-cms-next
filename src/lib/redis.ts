import { createClient } from "redis";
import { randomUUID } from "node:crypto";

type RedisClient = ReturnType<typeof createClient>;

const globalForRedis = globalThis as unknown as { __macRedis?: Promise<RedisClient | null> };

function connect(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL;
  if (!url) return Promise.resolve(null);
  const client = createClient({
    url,
    socket: {
      connectTimeout: 800,
      reconnectStrategy: (retries) => (retries > 5 ? false : Math.min(1000, 100 * retries)),
    },
  });
  client.on("error", () => {});
  return client
    .connect()
    .then(() => client)
    .catch(() => {
      try {
        client.disconnect();
      } catch {}
      return null;
    });
}

export function redisClient() {
  globalForRedis.__macRedis ??= connect();
  return globalForRedis.__macRedis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await redisClient();
  if (!client?.isReady) return null;
  try {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  const client = await redisClient();
  if (!client?.isReady) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: Math.max(1, ttlSeconds) });
  } catch {}
}

export async function cacheDel(...keys: string[]) {
  if (!keys.length) return;
  const client = await redisClient();
  if (!client?.isReady) return;
  try {
    await client.del(keys);
  } catch {}
}

export async function withRedisLock<T>(key: string, ttlSeconds: number, task: () => Promise<T>, waitMs = 600_000): Promise<T> {
  const client = await redisClient();
  if (!client?.isReady) return task();
  const token = randomUUID();
  const deadline = Date.now() + waitMs;
  for (;;) {
    const acquired = await client.set(key, token, { NX: true, EX: Math.max(1, ttlSeconds) }).catch(() => false);
    if (acquired) break;
    if (Date.now() >= deadline) throw new Error("等待采集锁超时");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  try {
    return await task();
  } finally {
    try {
      await client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        { keys: [key], arguments: [token] },
      );
    } catch {
      await client.del(key).catch(() => {});
    }
  }
}

export async function bumpPublicCacheVersion() {
  const client = await redisClient();
  if (!client?.isReady) return;
  try {
    await client.incr("mac:cms:htmlver");
  } catch {}
}

export const CACHE_KEYS = {
  settings: "mac:cms:settings",
  extra: "mac:cms:extra",
  navTypes: "mac:cms:nav-types",
  adminPath: "mac:cms:admin-path",
  htmlVersion: "mac:cms:htmlver",
} as const;