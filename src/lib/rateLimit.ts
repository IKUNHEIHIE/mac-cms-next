type Bucket = { count: number; resetAt: number };

const store = ((globalThis as unknown as { __rateLimit?: Map<string, Bucket> }).__rateLimit ??= new Map<string, Bucket>());

function bucket(key: string) {
  const now = Date.now();
  let b = store.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + 60_000 };
    store.set(key, b);
  }
  return b;
}

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const b = bucket(key);
  if (b.resetAt - Date.now() < windowMs - 60_000) b.resetAt = Date.now() + windowMs;
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.resetAt <= Date.now()) store.delete(k);
  }
  return b.count >= limit;
}

export function recordFailure(key: string, windowMs: number) {
  const b = bucket(key);
  b.count++;
  b.resetAt = Date.now() + windowMs;
}

export function clearRate(key: string) {
  store.delete(key);
}