import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const months = Number(b.months) === 12 ? 12 : 1;
  const cost = months === 12 ? 3000 : 300;
  if (user.userPoints < cost) return NextResponse.json({ code: 0, msg: `积分不足，需要 ${cost} 积分` }, { status: 400 });
  const now = Math.floor(Date.now() / 1000);
  const base = Math.max(user.userEndTime || now, now);
  const end = base + months * 30 * 86400;
  await prisma.user.update({
    where: { userId: user.userId },
    data: { userPoints: { decrement: cost }, groupId: "3", userEndTime: end },
  });
  await prisma.plog.create({
    data: { userId: user.userId, plogType: 2, plogPoints: -cost, plogTime: now, plogRemarks: `升级 VIP ${months} 个月` },
  });
  return NextResponse.json({ code: 1, msg: "升级成功", endTime: end });
}

export const dynamic = "force-dynamic";