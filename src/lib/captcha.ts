import { createHmac, timingSafeEqual } from "node:crypto";

const secret = process.env.AUTH_SECRET || "mac-cms-next-dev-secret-change-me";

function sign(payload: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createCaptcha() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const payload = Buffer.from(JSON.stringify({ a, b, exp: Date.now() + 5 * 60 * 1000 })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="42" viewBox="0 0 120 42">
  <rect width="120" height="42" rx="6" fill="#f7f7f7"/>
  <path d="M6 30 L114 12 M8 12 L112 32" stroke="#e0e0e0" stroke-width="1"/>
  <text x="14" y="29" font-family="Arial" font-size="20" fill="#444">${a} + ${b} = ?</text>
</svg>`;
  return { token, svg };
}

export function verifyCaptcha(token: string, answer: string) {
  if (!token || !answer) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expect = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { a: number; b: number; exp: number };
    if (!data.exp || data.exp < Date.now()) return false;
    return Number(answer) === data.a + data.b;
  } catch {
    return false;
  }
}