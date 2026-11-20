import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { collectVods, LZ_API } from "@/lib/collect";
import { getExtra, saveExtra, type TimingTask } from "@/lib/extraSettings";

export const maxDuration = 300;

async function runTask(task: TimingTask) {
  if (task.action === "resetHits") {
    const r = await prisma.vod.updateMany({ data: { vodHitsDay: 0, vodHitsWeek: 0, vodHitsMonth: 0 } });
    return `清零 ${r.count} 部影片的日/周/月点击`;
  }
  if (task.action === "revalidate") {
    for (const p of ["/", "/map", "/label/rank", "/topic", "/art/type/5", "/admin"]) revalidatePath(p);
    revalidatePath("/", "layout");
    return "已刷新全站缓存";
  }
  if (task.action === "collect") {
    let params: { api?: string; pages?: number; typeId?: number; markLevel?: boolean } = {};
    try {
      params = task.params ? JSON.parse(task.params) : {};
    } catch {
      params = {};
    }
    const r = await collectVods({
      api: params.api || LZ_API,
      pages: Math.max(1, Math.min(10, Number(params.pages) || 1)),
      typeId: params.typeId ? Number(params.typeId) : undefined,
      markLevel: Boolean(params.markLevel),
    });
    return `采集：新增 ${r.imported}，更新 ${r.updated}`;
  }
  return "未知任务";
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.CRON_SECRET;
  const isCron = Boolean(secret && request.headers.get("x-cron-secret") === secret);
  if (!isCron && !(await assertAdmin())) {
    return NextResponse.json({ code: 0, msg: "未授权" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { force?: boolean };
  const force = url.searchParams.get("force") === "1" || Boolean(body.force);
  const now = Math.floor(Date.now() / 1000);
  const extra = await getExtra();
  const due = extra.timming.filter((t) => t.enabled && (force || now - t.lastRun >= t.intervalMinutes * 60));
  if (due.length === 0) return NextResponse.json({ code: 1, msg: "没有到期的任务" });

  const results: { id: string; name: string; ok: boolean; msg: string }[] = [];
  for (const task of due) {
    try {
      const msg = await runTask(task);
      task.lastRun = Math.floor(Date.now() / 1000);
      results.push({ id: task.id, name: task.name, ok: true, msg });
    } catch (e) {
      results.push({ id: task.id, name: task.name, ok: false, msg: e instanceof Error ? e.message : "执行失败" });
    }
  }
  await saveExtra({ timming: extra.timming });
  return NextResponse.json({ code: 1, msg: `已执行 ${results.length} 个任务`, results });
}

export async function GET(request: Request) {
  return POST(request);
}

export const dynamic = "force-dynamic";