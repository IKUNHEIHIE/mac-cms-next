import Link from "next/link";
import { prisma } from "@/lib/db";
import AutoRefresh from "@/components/admin/AutoRefresh";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "全量采集" };

type State = {
  status?: string;
  nextPage?: number;
  pagecount?: number;
  total?: number;
  pagesDone?: number;
  imported?: number;
  skipped?: number;
  failedPages?: number[];
  updatedAt?: number;
  startedAt?: number;
  rate?: { interval?: number };
  lastError?: string;
};

const STATUS: Record<string, string> = {
  running: "采集中",
  paused: "已暂停",
  done: "已完成",
  "done-with-errors": "已完成（有失败页）",
};

export default async function CollectAllPage() {
  const [row, vodCount, typeCount] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "collect_all_state" } }),
    prisma.vod.count(),
    prisma.type.count(),
  ]);
  let state: State = {};
  try {
    state = row ? (JSON.parse(row.value) as State) : {};
  } catch {}
  const pagecount = state.pagecount || 8234;
  const pagesDone = state.pagesDone || 0;
  const pct = Math.min(100, (pagesDone / Math.max(1, pagecount)) * 100);
  const interval = state.rate?.interval || 1500;
  const remaining = Math.max(0, pagecount - pagesDone);
  const etaMin = Math.ceil((remaining * interval) / 60000);
  const status = state.status || "未开始";

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={15} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">量子资源站 · 全量采集</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            数据源 lzizy.net，按页抓取（每页 20 条），单线程自适应限速并断点续采。当前影片 {vodCount} 部 / 分类 {typeCount} 个。
          </p>
        </div>
        <Link href="/admin/collect" className="h-9 rounded-lg border border-card-border px-4 text-sm leading-9 text-text-secondary hover:bg-background-gray-primary">
          返回资源采集
        </Link>
      </div>

      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status === "running" ? "bg-blue-50 text-blue-600" : status === "done" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
            {STATUS[status] || status}
          </span>
          <span className="text-xs text-text-tertiary">
            {state.updatedAt ? `最后更新 ${fmtTime(state.updatedAt, true)} · 每 15 秒自动刷新` : "尚无任务记录"}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-background-gray-primary">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-text-secondary">
          <span>
            {pagesDone} / {pagecount} 页（{pct.toFixed(1)}%）· 预计剩余约 {etaMin} 分钟
          </span>
          <span>当前间隔 {interval} ms</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-background-gray-primary p-3">
            <p className="text-xl font-bold text-text-primary">{state.total || 164672}</p>
            <p className="text-xs text-text-tertiary">资源站总条数</p>
          </div>
          <div className="rounded-xl bg-background-gray-primary p-3">
            <p className="text-xl font-bold text-text-primary">{state.imported || 0}</p>
            <p className="text-xs text-text-tertiary">本次入库</p>
          </div>
          <div className="rounded-xl bg-background-gray-primary p-3">
            <p className="text-xl font-bold text-text-primary">{state.skipped || 0}</p>
            <p className="text-xs text-text-tertiary">重复跳过</p>
          </div>
          <div className="rounded-xl bg-background-gray-primary p-3">
            <p className="text-xl font-bold text-text-primary">{state.failedPages?.length || 0}</p>
            <p className="text-xs text-text-tertiary">失败页</p>
          </div>
        </div>
        {state.lastError ? <p className="mt-3 text-xs text-red-500">最近错误：{state.lastError}</p> : null}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-7 text-blue-700">
        <strong>运行 / 续采：</strong>
        <code className="mx-1">npx tsx scripts/collect-all.ts</code>（从断点继续），
        <code className="mx-1">--from 页码</code> 可回补指定页之后的数据，
        <code className="mx-1">--fresh</code> 从头开始。
        被限流时会自动冷却 60 秒并增大间隔，进度写入 <code>mac_setting.collect_all_state</code>。
      </div>
    </div>
  );
}