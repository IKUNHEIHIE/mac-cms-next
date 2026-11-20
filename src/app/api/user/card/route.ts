import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addPoints, currentUser } from "@/lib/user";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const no = String(b.card_no || "").trim();
  const pwd = String(b.card_pwd || "").trim();
  if (!no || !pwd) return NextResponse.json({ code: 0, msg: "请输入卡号和密码" }, { status: 400 });
  const card = await prisma.card.findFirst({ where: { cardNo: no, cardPwd: pwd } });
  if (!card) return NextResponse.json({ code: 0, msg: "卡号或密码错误" }, { status: 400 });
  if (card.cardUseStatus === 1) return NextResponse.json({ code: 0, msg: "该充值卡已被使用" }, { status: 400 });
  const now = Math.floor(Date.now() / 1000);
  await prisma.card.update({ where: { cardId: card.cardId }, data: { cardUseStatus: 1, userId: user.userId, cardUseTime: now } });
  const points = card.cardPoints + card.cardMoney * 10;
  await addPoints(user.userId, points, `充值卡充值 ${no}`, 1);
  return NextResponse.json({ code: 1, msg: `充值成功，获得 ${points} 积分`, points });
}

export const dynamic = "force-dynamic";