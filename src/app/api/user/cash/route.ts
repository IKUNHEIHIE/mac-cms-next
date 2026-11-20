import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const points = Math.floor(Number(b.points));
  if (!Number.isFinite(points) || points < 1000) {
    return NextResponse.json({ code: 0, msg: "最低提现 1000 积分" }, { status: 400 });
  }
  if (points > user.userPoints) return NextResponse.json({ code: 0, msg: "积分不足" }, { status: 400 });
  const bankName = String(b.bank_name || "").trim();
  const bankNo = String(b.bank_no || "").trim();
  const payee = String(b.payee_name || "").trim();
  if (!bankName || !bankNo || !payee) return NextResponse.json({ code: 0, msg: "请填写完整的收款信息" }, { status: 400 });
  const money = Math.round((points / 100) * 100) / 100;
  const now = Math.floor(Date.now() / 1000);
  await prisma.user.update({ where: { userId: user.userId }, data: { userPoints: { decrement: points } } });
  await prisma.cash.create({
    data: {
      userId: user.userId,
      cashStatus: 0,
      cashPoints: points,
      cashMoney: money,
      cashBankName: bankName.slice(0, 60),
      cashBankNo: bankNo.slice(0, 30),
      cashPayeeName: payee.slice(0, 30),
      cashTime: now,
    },
  });
  await prisma.plog.create({
    data: { userId: user.userId, plogType: 2, plogPoints: -points, plogTime: now, plogRemarks: `申请提现 ${money} 元` },
  });
  return NextResponse.json({ code: 1, msg: "提现申请已提交，等待审核", money });
}

export const dynamic = "force-dynamic";