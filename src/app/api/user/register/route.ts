import { NextResponse } from "next/server";
import { isBlockedRequest, getExtra } from "@/lib/extraSettings";
import { verifyCaptcha } from "@/lib/captcha";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { USER_COOKIE, setAuthCookie, signToken } from "@/lib/auth";
import { ipToInt } from "@/lib/user";
import { ipFromRequest } from "@/lib/extraSettings";
import { isRateLimited, recordFailure } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const limitKey = `register:${ipFromRequest(request)}`;
  if (isRateLimited(limitKey, 10, 60 * 60_000)) {
    return NextResponse.json({ code: 0, msg: "注册过于频繁，请稍后再试" }, { status: 429 });
  }
  recordFailure(limitKey, 60 * 60_000);
  const b = await request.json().catch(() => ({}));
  const extra = await getExtra();
  if (extra.captcha.enabled && !verifyCaptcha(String(b.captcha_token || ""), String(b.captcha_answer || ""))) {
    return NextResponse.json({ code: 0, msg: "验证码错误或已过期" }, { status: 400 });
  }
  const userName = String(b.user_name || "").trim();
  const userPwd = String(b.user_pwd || "");
  const userPwd2 = String(b.user_pwd2 || "");
  const email = String(b.user_email || "").trim();
  if (!/^[\w\u4e00-\u9fa5@.-]{3,30}$/.test(userName)) {
    return NextResponse.json({ code: 0, msg: "账号需 3-30 位字母、数字或中文" }, { status: 400 });
  }
  if (userPwd.length < 6) return NextResponse.json({ code: 0, msg: "密码至少 6 位" }, { status: 400 });
  if (userPwd2 && userPwd !== userPwd2) return NextResponse.json({ code: 0, msg: "两次密码不一致" }, { status: 400 });
  const exists = await prisma.user.findFirst({ where: { userName } });
  if (exists) return NextResponse.json({ code: 0, msg: "该账号已被注册" }, { status: 400 });

  const now = Math.floor(Date.now() / 1000);
  const user = await prisma.user.create({
    data: {
      groupId: "2",
      userName,
      userPwd: await bcrypt.hash(userPwd, 10),
      userNickName: userName,
      userEmail: email,
      userStatus: 1,
      userRegTime: now,
      userRegIp: ipToInt(request.headers.get("x-forwarded-for")),
      userQuestion: String(b.user_question || "").slice(0, 255),
      userAnswer: String(b.user_answer || "").slice(0, 255),
    },
  });
  const token = await signToken({ uid: user.userId, name: user.userName });
  await setAuthCookie(USER_COOKIE, token);
  return NextResponse.json({ code: 1, msg: "注册成功" });
}

export const dynamic = "force-dynamic";