import { NextResponse } from "next/server";
import { isBlockedRequest, getExtra } from "@/lib/extraSettings";
import { verifyCaptcha } from "@/lib/captcha";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, USER_COOKIE, clearAuthCookie, getSessionAdmin, getSessionUser, setAuthCookie, signToken } from "@/lib/auth";
import { ipToInt } from "@/lib/user";

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const extra = await getExtra();
  if (extra.captcha.enabled && !verifyCaptcha(String(body.captcha_token || ""), String(body.captcha_answer || ""))) {
    return NextResponse.json({ code: 0, msg: "验证码错误或已过期" }, { status: 400 });
  }
  const userName = String(body.user_name || "").trim();
  const userPwd = String(body.user_pwd || "");
  if (!userName || !userPwd) return NextResponse.json({ code: 0, msg: "请输入账号和密码" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { userName } });
  if (!user) return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });
  if (user.userStatus !== 1) return NextResponse.json({ code: 0, msg: "账号已被禁用" }, { status: 403 });
  const ok = await bcrypt.compare(userPwd, user.userPwd);
  if (!ok) return NextResponse.json({ code: 0, msg: "账号或密码错误" }, { status: 400 });

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