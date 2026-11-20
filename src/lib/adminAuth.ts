import { prisma } from "./db";
import { getSessionAdmin } from "./auth";

export async function assertAdmin() {
  const session = await getSessionAdmin();
  if (!session) return null;
  const admin = await prisma.admin.findUnique({ where: { adminId: session.aid } });
  if (!admin || admin.adminStatus !== 1) return null;
  return admin;
}