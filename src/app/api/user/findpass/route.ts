import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ipFromRequest } from "@/lib/extraSettings";
import { isRateLimited, recordFailure } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const limitKey = `findpass:${ipFromRequest(request)}`;
  if (isRateLimited(limitKey, 5, 60 * 60_000)) {
    return NextResponse.json({ code: 0, msg: "尝试次数过多，请稍后再试" }, { status: 429 });
  }
  recordFailure(limitKey, 60 * 60_000);
  const userName = String(b.user_name || "").trim();
  const answer = String(b.user_answer || "").trim();
  const newPwd = String(b.user_pwd || "");
  if (!userName || !answer || newPwd.length < 6) {
    return NextResponse.json({ code: 0, msg: "请填写账号、密保答案和至少 6 位的新密码" }, { status: 400 });
  }
  const user = await prisma.user.findFirst({ where: { userName } });
  if (!user) return NextResponse.json({ code: 0, msg: "账号不存在" }, { status: 400 });
  if (!user.userAnswer) return NextResponse.json({ code: 0, msg: "该账号未设置密保，请联系管理员" }, { status: 400 });
  if (user.userAnswer !== answer) return NextResponse.json({ code: 0, msg: "密保答案不正确" }, { status: 400 });
  await prisma.user.update({ where: { userId: user.userId }, data: { userPwd: await bcrypt.hash(newPwd, 10) } });
  return NextResponse.json({ code: 1, msg: "密码已重置，请重新登录" });
}

export const dynamic = "force-dynamic";