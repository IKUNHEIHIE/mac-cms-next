import { prisma } from "./db";
import { getSessionUser } from "./auth";

export async function currentUser() {
  const session = await getSessionUser();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { userId: session.uid } });
  if (!user || user.userStatus !== 1) return null;
  return user;
}

export function ipToInt(ip: string | null) {
  if (!ip) return 0;
  const first = ip.split(",")[0].trim();
  if (first === "::1" || first === "127.0.0.1") return 2130706433;
  const parts = first.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return 0;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}


export function groupIdOf(user: { groupId: string }): number {
  const first = (user.groupId || "2").split(",")[0];
  return Number(first) || 2;
}