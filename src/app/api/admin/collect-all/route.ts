import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { getCollectState, isPidAlive, pauseCollector, startCollector } from "@/lib/collectRunner";

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const state = await getCollectState();
  return NextResponse.json({ code: 1, running: isPidAlive(state?.pid), state });
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action === "pause") {
    const r = await pauseCollector();
    return NextResponse.json({ code: 1, msg: r.msg });
  }
  if (body.action === "start" || body.action === "restart") {
    const r = await startCollector(body.action === "restart");
    return NextResponse.json({ code: r.ok ? 1 : 0, msg: r.msg, pid: r.pid }, { status: r.ok ? 200 : 400 });
  }
  return NextResponse.json({ code: 0, msg: "未知操作" }, { status: 400 });
}

export const dynamic = "force-dynamic";