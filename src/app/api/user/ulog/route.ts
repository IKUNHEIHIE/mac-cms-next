import { NextResponse } from "next/server";
import { isBlockedRequest } from "@/lib/extraSettings";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const type = Number(b.type) || 1;
  const mid = Number(b.mid) || 1;
  const rid = Number(b.rid);
  if (!rid) return NextResponse.json({ code: 0, msg: "参数错误" }, { status: 400 });
  const now = Math.floor(Date.now() / 1000);

  const existing = await prisma.ulog.findFirst({ where: { userId: user.userId, ulogType: type, ulogRid: rid } });

  if (type === 1) {
    if (existing) {
      await prisma.ulog.delete({ where: { ulogId: existing.ulogId } });
      return NextResponse.json({ code: 1, msg: "已取消收藏", favorited: false });
    }
    await prisma.ulog.create({ data: { userId: user.userId, ulogMid: mid, ulogType: 1, ulogRid: rid, ulogTime: now } });
    return NextResponse.json({ code: 1, msg: "收藏成功", favorited: true });
  }

  if (type === 4) {
    const sid = Number(b.sid) || 0;
    const nid = Number(b.nid) || 0;
    if (existing) {
      await prisma.ulog.update({ where: { ulogId: existing.ulogId }, data: { ulogTime: now, ulogSid: sid, ulogNid: nid } });
    } else {
      await prisma.ulog.create({ data: { userId: user.userId, ulogMid: mid, ulogType: 4, ulogRid: rid, ulogSid: sid, ulogNid: nid, ulogTime: now } });
    }
    await prisma.vod.update({
      where: { vodId: rid },
      data: { vodHits: { increment: 1 }, vodHitsDay: { increment: 1 }, vodHitsWeek: { increment: 1 }, vodHitsMonth: { increment: 1 }, vodTimeHits: now },
    }).catch(() => {});
    return NextResponse.json({ code: 1, msg: "已记录观看历史" });
  }

  if (existing) await prisma.ulog.update({ where: { ulogId: existing.ulogId }, data: { ulogTime: now } });
  else await prisma.ulog.create({ data: { userId: user.userId, ulogMid: mid, ulogType: type, ulogRid: rid, ulogTime: now } });
  return NextResponse.json({ code: 1, msg: "操作成功" });
}

export const dynamic = "force-dynamic";