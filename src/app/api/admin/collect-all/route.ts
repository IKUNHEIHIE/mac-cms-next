import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { getCollectState, isPidAlive, pauseCollector, startCollector } from "@/lib/collectRunner";

export async function GET(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const nodeId = Number(new URL(request.url).searchParams.get("nodeId")) || undefined;
  const state = await getCollectState(nodeId);
  return NextResponse.json({ code: 1, running: isPidAlive(state?.pid), state });
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; nodeId?: number };
  const nodeId = Number(body.nodeId) || undefined;
  const node = nodeId ? await prisma.collect.findUnique({ where: { collectId: nodeId } }) : null;
  if (nodeId && !node) return NextResponse.json({ code: 0, msg: "采集节点不存在" }, { status: 404 });
  const format = node ? (node.collectType === 1 ? "xml" : node.collectType === 2 ? "json" : "auto") : "auto";
  if (body.action === "pause") {
    const r = await pauseCollector(nodeId);
    return NextResponse.json({ code: 1, msg: r.msg });
  }
  if (body.action === "start" || body.action === "restart") {
    const r = await startCollector(body.action === "restart", node ? { nodeId, api: node.collectUrl, format } : {});
    return NextResponse.json({ code: r.ok ? 1 : 0, msg: r.msg, pid: r.pid }, { status: r.ok ? 200 : 400 });
  }
  return NextResponse.json({ code: 0, msg: "未知操作" }, { status: 400 });
}

export const dynamic = "force-dynamic";