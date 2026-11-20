import { NextResponse } from "next/server";
import { isBlockedRequest } from "@/lib/extraSettings";
import { prisma } from "@/lib/db";
import { currentUser, ipToInt } from "@/lib/user";

export async function POST(request: Request) {
  if (await isBlockedRequest(request)) return NextResponse.json({ code: 0, msg: "访问受限" }, { status: 403 });
  const user = await currentUser();
  const b = await request.json().catch(() => ({}));
  const content = String(b.content || "").trim();
  if (!content) return NextResponse.json({ code: 0, msg: "留言内容不能为空" }, { status: 400 });
  const name = String(b.name || "").trim() || user?.userNickName || user?.userName || "游客";
  const row = await prisma.gbook.create({
    data: {
      gbookRid: 0,
      userId: user?.userId || 0,
      gbookStatus: 1,
      gbookName: name.slice(0, 60),
      gbookIp: ipToInt(request.headers.get("x-forwarded-for")),
      gbookTime: Math.floor(Date.now() / 1000),
      gbookContent: content.slice(0, 255),
    },
  });
  return NextResponse.json({ code: 1, msg: "留言成功", gbook: row });
}

export const dynamic = "force-dynamic";