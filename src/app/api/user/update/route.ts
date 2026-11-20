import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const data: Record<string, string> = {};
  if (typeof b.user_nick_name === "string") data.userNickName = b.user_nick_name.slice(0, 30);
  if (typeof b.user_email === "string") data.userEmail = b.user_email.slice(0, 30);
  if (typeof b.user_qq === "string") data.userQq = b.user_qq.slice(0, 16);
  if (typeof b.user_phone === "string") data.userPhone = b.user_phone.slice(0, 16);
  if (typeof b.user_portrait === "string") data.userPortrait = b.user_portrait.slice(0, 100);
  if (typeof b.user_question === "string") data.userQuestion = b.user_question.slice(0, 255);
  if (typeof b.user_answer === "string") data.userAnswer = b.user_answer.slice(0, 255);

  if (b.user_pwd) {
    const oldPwd = String(b.old_pwd || "");
    if (!(await bcrypt.compare(oldPwd, user.userPwd))) {
      return NextResponse.json({ code: 0, msg: "原密码不正确" }, { status: 400 });
    }
    if (String(b.user_pwd).length < 6) return NextResponse.json({ code: 0, msg: "新密码至少 6 位" }, { status: 400 });
    data.userPwd = await bcrypt.hash(String(b.user_pwd), 10);
  }
  await prisma.user.update({ where: { userId: user.userId }, data });
  return NextResponse.json({ code: 1, msg: "资料已更新" });
}

export const dynamic = "force-dynamic";