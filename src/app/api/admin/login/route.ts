import { NextResponse } from "next/server";
import { isBlockedRequest } from "@/lib/extraSettings";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, setAuthCookie, signToken } from "@/lib/auth";
import { ipToInt } from "@/lib/user";

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  const adminName = String(b.admin_name || "").trim();
  const adminPwd = String(b.admin_pwd || "");
  if (!adminName || !adminPwd) return NextResponse.json({ code: 0, msg: "请输入账号和密码" }, { status: 400 });
  const admin = await prisma.admin.findFirst({ where: { adminName } });
  if (!admin) return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });
  if (admin.adminStatus !== 1) return NextResponse.json({ code: 0, msg: "账号已被禁用" }, { status: 403 });
  const ok = await bcrypt.compare(adminPwd, admin.adminPwd);
  if (!ok) return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });
  const now = Math.floor(Date.now() / 1000);
  await prisma.admin.update({
    where: { adminId: admin.adminId },
    data: {
      adminLastLoginTime: admin.adminLoginTime,
      adminLastLoginIp: admin.adminLoginIp,
      adminLoginTime: now,
      adminLoginIp: ipToInt(request.headers.get("x-forwarded-for")),
      adminLoginNum: { increment: 1 },
    },
  });
  const token = await signToken({ aid: admin.adminId, name: admin.adminName }, 24 * 7);
  await setAuthCookie(ADMIN_COOKIE, token);
  return NextResponse.json({ code: 1, msg: "登录成功" });
}

export const dynamic = "force-dynamic";