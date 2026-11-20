import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "mac-cms-next-dev-secret-change-me",
);

export const USER_COOKIE = "mac_user";
export const ADMIN_COOKIE = "mac_admin";

export type UserToken = { uid: number; name: string };
export type AdminToken = { aid: number; name: string };

export async function signToken(payload: Record<string, unknown>, hours = 24 * 30) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secret);
}

export async function verifyToken<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}

export async function setAuthCookie(name: string, token: string) {
  const jar = await cookies();
  jar.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookie(name: string) {
  const jar = await cookies();
  jar.delete(name);
}

export async function getSessionUser() {
  const jar = await cookies();
  const payload = await verifyToken<UserToken>(jar.get(USER_COOKIE)?.value);
  return payload;
}

export async function getSessionAdmin() {
  const jar = await cookies();
  const payload = await verifyToken<AdminToken>(jar.get(ADMIN_COOKIE)?.value);
  return payload;
}