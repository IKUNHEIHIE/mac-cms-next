import { NextResponse } from "next/server";
import { isBlockedRequest, getExtra } from "@/lib/extraSettings";
import { verifyCaptcha } from "@/lib/captcha";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, USER_COOKIE, clearAuthCookie, getSessionAdmin, getSessionUser, setAuthCookie, signToken } from "@/lib/auth";
import { ipToInt } from "@/lib/user";
import { ipFromRequest } from "@/lib/extraSettings";
import { clearRate, isRateLimited, recordFailure } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const limitKey = `user-login:${ipFromRequest(request)}`;
  if (isRateLimited(limitKey, 20, 15 * 60_000)) {
    return NextResponse.json({ code: 0, msg: "登录尝试过多，请稍后再试" }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const extra = await getExtra();
  if (extra.captcha.enabled && !verifyCaptcha(String(body.captcha_token || ""), String(body.captcha_answer || ""))) {
    return NextResponse.json({ code: 0, msg: "验证码错误或已过期" }, { status: 400 });
  }
  const userName = String(body.user_name || "").trim();
  const accountKey = `user-login-account:${userName.toLowerCase()}`;
  if (userName && isRateLimited(accountKey, 20, 15 * 60_000)) {
    return NextResponse.json({ code: 0, msg: "该账号登录尝试过多，请稍后再试" }, { status: 429 });
  }
  const userPwd = String(body.user_pwd || "");
  if (!userName || !userPwd) {
    recordFailure(limitKey, 15 * 60_000);
    if (userName) recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "请输入账号和密码" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { userName } });
  if (!user) {
    recordFailure(limitKey, 15 * 60_000);
    if (userName) recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });
  }
  if (user.userStatus !== 1) {
    recordFailure(limitKey, 15 * 60_000);
    if (userName) recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "账号已被禁用" }, { status: 403 });
  }
  const ok = await bcrypt.compare(userPwd, user.userPwd);
  if (!ok) {
    recordFailure(limitKey, 15 * 60_000);
    if (userName) recordFailure(accountKey, 15 * 60_000);
    return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });
  }
  clearRate(limitKey);
  if (userName) clearRate(accountKey);

  const now = Math.floor(Date.now() / 1000);
  const ip = ipToInt(request.headers.get("x-forwarded-for"));
  await prisma.user.update({
    where: { userId: user.userId },
    data: {
      userLastLoginTime: user.userLoginTime,
      userLastLoginIp: user.userLoginIp,
      userLoginTime: now,
      userLoginIp: ip,
      userLoginNum: { increment: 1 },
    },
  });
  const token = await signToken({ uid: user.userId, name: user.userName });
  await setAuthCookie(USER_COOKIE, token);
  return NextResponse.json({ code: 1, msg: "登录成功" });
}

export async function DELETE() {
  await clearAuthCookie(USER_COOKIE);
  return NextResponse.json({ code: 1, msg: "已退出登录" });
}

export async function GET() {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ code: 0 });
  const u = await prisma.user.findUnique({ where: { userId: s.uid }, select: { userId: true, userName: true, userNickName: true } });
  return NextResponse.json({ code: 1, user: u });
}

export const dynamic = "force-dynamic";