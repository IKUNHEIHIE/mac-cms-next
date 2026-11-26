import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { collectVods, LZ_API } from "@/lib/collect";
import { getExtra, markTimingRun, type TimingTask } from "@/lib/extraSettings";
import { collectHoursForTask, isTimingDue } from "@/lib/timing";

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
    let params: { api?: string; pages?: number; typeId?: number; format?: "auto" | "json" | "xml"; markLevel?: boolean } = {};
    try {
      params = task.params ? JSON.parse(task.params) : {};
    } catch {
      params = {};
    }
    const r = await collectVods({
      api: params.api || LZ_API,
      pages: Math.max(1, Math.min(100, Number(params.pages) || 1)),
      typeId: params.typeId ? Number(params.typeId) : undefined,
      format: ["auto", "json", "xml"].includes(String(params.format || "")) ? params.format : "auto",
      hours: collectHoursForTask(task),
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
  const now = new Date();
  const extra = await getExtra();
  const due = extra.timming.filter((t) => t.enabled && (force || isTimingDue(t, now)));
  if (due.length === 0) return NextResponse.json({ code: 1, msg: "没有到期的任务" });

  const results: { id: string; name: string; ok: boolean; msg: string }[] = [];
  const succeeded: string[] = [];
  const execute = async (task: TimingTask) => {
    try {
      const msg = await runTask(task);
      succeeded.push(task.id);
      results.push({ id: task.id, name: task.name, ok: true, msg });
    } catch (e) {
      results.push({ id: task.id, name: task.name, ok: false, msg: e instanceof Error ? e.message : "执行失败" });
    }
  };
  const sequential = due.filter((task) => task.action !== "collect");
  const parallel = due.filter((task) => task.action === "collect");
  for (const task of sequential) await execute(task);
  const limit = Math.max(1, Math.min(4, Number(process.env.CRON_COLLECT_PARALLEL) || 2));
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, parallel.length) }, async () => {
      while (cursor < parallel.length) {
        const task = parallel[cursor++];
        await execute(task);
      }
    }),
  );
  await markTimingRun(succeeded);
  return NextResponse.json({ code: 1, msg: `已执行 ${results.length} 个任务`, results });
}

export async function GET(request: Request) {
  return POST(request);
}

export const dynamic = "force-dynamic";