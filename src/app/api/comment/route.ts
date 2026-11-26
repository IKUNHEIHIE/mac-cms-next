import { NextResponse } from "next/server";
import { isBlockedRequest } from "@/lib/extraSettings";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import { ipToInt } from "@/lib/user";
import { ipFromRequest } from "@/lib/extraSettings";
import { isRateLimited, recordFailure } from "@/lib/rateLimit";
import { bumpPublicCacheVersion } from "@/lib/redis";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rid = Number(url.searchParams.get("rid")) || 0;
  const mid = Number(url.searchParams.get("mid")) || 1;
  const list = await prisma.comment.findMany({
    where: { commentRid: rid, commentMid: mid, commentStatus: 1 },
    orderBy: { commentTime: "desc" },
    take: 50,
  });
  return NextResponse.json({ code: 1, list });
}

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ code: 0, msg: "请先登录后评论" }, { status: 401 });
  const limitKey = `comment:${ipFromRequest(request)}`;
  if (isRateLimited(limitKey, 30, 10 * 60_000)) {
    return NextResponse.json({ code: 0, msg: "评论过于频繁，请稍后再试" }, { status: 429 });
  }
  recordFailure(limitKey, 10 * 60_000);
  const b = await request.json().catch(() => ({}));
  const content = String(b.content || "").trim();
  const rid = Number(b.rid);
  const mid = Number(b.mid) || 1;
  if (!rid || !content) return NextResponse.json({ code: 0, msg: "评论内容不能为空" }, { status: 400 });
  const comment = await prisma.comment.create({
    data: {
      commentMid: mid,
      commentRid: rid,
      userId: user.userId,
      commentStatus: 1,
      commentName: user.userNickName || user.userName,
      commentIp: ipToInt(request.headers.get("x-forwarded-for")),
      commentTime: Math.floor(Date.now() / 1000),
      commentContent: content.slice(0, 255),
    },
  });
  await bumpPublicCacheVersion();
  return NextResponse.json({ code: 1, msg: "评论成功", comment });
}

export const dynamic = "force-dynamic";