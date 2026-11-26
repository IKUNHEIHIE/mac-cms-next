import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { collectVods, type CollectFormat } from "@/lib/collect";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { nodeId?: number; mode?: string };
  const nodeId = Number(body.nodeId) || 0;
  const node = nodeId ? await prisma.collect.findUnique({ where: { collectId: nodeId } }) : null;
  if (!node) return NextResponse.json({ code: 0, msg: "采集节点不存在" }, { status: 404 });
  if (node.collectMid !== 1) return NextResponse.json({ code: 0, msg: "该节点不是视频采集节点" }, { status: 400 });
  const format: CollectFormat = node.collectType === 1 ? "xml" : node.collectType === 2 ? "json" : "auto";
  const week = body.mode === "week";
  if (!week && body.mode !== "current") return NextResponse.json({ code: 0, msg: "未知采集方式" }, { status: 400 });
  try {
    const r = await collectVods({
      api: node.collectUrl,
      format,
      pages: week ? 100 : 1,
      hours: week ? 168 : undefined,
      markLevel: false,
    });
    return NextResponse.json({
      code: 1,
      msg: `${week ? "采集本周" : "采集当前"}完成：新增 ${r.imported} 部，更新 ${r.updated} 部，处理 ${r.total} 条`,
    });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "采集失败" }, { status: 502 });
  }
}
