import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const vodId = Number(b.vod_id);
  if (!vodId) return NextResponse.json({ code: 0, msg: "参数错误" }, { status: 400 });
  const vod = await prisma.vod.findUnique({ where: { vodId } });
  if (!vod) return NextResponse.json({ code: 0, msg: "影片不存在" }, { status: 404 });
  const cost = vod.vodPoints || 0;
  if (cost <= 0) return NextResponse.json({ code: 0, msg: "该影片无需积分购买" }, { status: 400 });
  const owned = await prisma.ulog.findFirst({ where: { userId: user.userId, ulogType: 5, ulogRid: vodId } });
  if (owned) return NextResponse.json({ code: 1, msg: "已购买，可直接观看" });
  if (user.userPoints < cost) return NextResponse.json({ code: 0, msg: "积分不足" }, { status: 400 });
  const now = Math.floor(Date.now() / 1000);
  await prisma.user.update({ where: { userId: user.userId }, data: { userPoints: { decrement: cost } } });
  await prisma.ulog.create({ data: { userId: user.userId, ulogMid: 1, ulogType: 5, ulogRid: vodId, ulogPoints: cost, ulogTime: now } });
  await prisma.plog.create({ data: { userId: user.userId, plogType: 2, plogPoints: -cost, plogTime: now, plogRemarks: `购买影片《${vod.vodName}》` } });
  return NextResponse.json({ code: 1, msg: "购买成功" });
}

export const dynamic = "force-dynamic";