import { NextResponse } from "next/server";
import { isBlockedRequest } from "@/lib/extraSettings";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, setAuthCookie, signToken } from "@/lib/auth";
import { ipToInt } from "@/lib/user";
import { ipFromRequest } from "@/lib/extraSettings";
import { clearRate, isRateLimited, recordFailure } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const ip = ipFromRequest(request);
  const limitKey = `admin-login:${ip}`;
  if (isRateLimited(limitKey, 8, 15 * 60_000)) {
    return NextResponse.json({ code: 0, msg: "登录尝试过多，请 15 分钟后再试" }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  const adminName = String(b.admin_name || "").trim();
  const adminPwd = String(b.admin_pwd || "");
  const accountKey = `admin-login-account:${adminName.toLowerCase()}`;
  if (isRateLimited(accountKey, 8, 15 * 60_000)) {
    return NextResponse.json({ code: 0, msg: "该账号登录尝试过多，请 15 分钟后再试" }, { status: 429 });
  }
  if (!adminName || !adminPwd) {
    recordFailure(limitKey, 15 * 60_000);
    recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "请输入账号和密码" }, { status: 400 });
  }
  const admin = await prisma.admin.findFirst({ where: { adminName } });
  if (!admin) {
    recordFailure(limitKey, 15 * 60_000);
    recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });
  }
  if (admin.adminStatus !== 1) {
    recordFailure(limitKey, 15 * 60_000);
    recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "账号已被禁用" }, { status: 403 });
  }
  const ok = await bcrypt.compare(adminPwd, admin.adminPwd);
  if (!ok) {
    recordFailure(limitKey, 15 * 60_000);
    recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });
  }
  clearRate(limitKey);
  clearRate(accountKey);
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