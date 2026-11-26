import { getExtra } from "@/lib/extraSettings";
import { prisma } from "@/lib/db";
import JsonEditorForm from "@/components/admin/JsonEditorForm";
import CronRunButton from "@/components/admin/CronRunButton";
import TimingQuickAdd from "@/components/admin/TimingQuickAdd";
import { fmtTime } from "@/lib/maccms";
import { LZ_API } from "@/lib/collect";
import { timingScheduleLabel } from "@/lib/timing";

export const dynamic = "force-dynamic";
export const metadata = { title: "定时任务" };

export default async function TimmingPage() {
  const [extra, collectSources] = await Promise.all([
    getExtra(),
    prisma.collect.findMany({
      orderBy: { collectId: "asc" },
      select: { collectId: true, collectName: true, collectUrl: true, collectType: true },
    }),
  ]);
  const sources = collectSources.map((s) => ({
    id: s.collectId,
    name: s.collectName,
    url: s.collectUrl,
    format: (s.collectType === 1 ? "xml" : s.collectType === 2 ? "json" : "auto") as "auto" | "json" | "xml",
  }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">定时任务</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          由外部 Cron 调用 <code>POST /api/cron</code>（请求头 <code>x-cron-secret</code> 或管理员登录态）执行；也可在此手动运行。
        </p>
      </div>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-3 font-semibold text-text-primary">任务列表</h2>
        <table className="mb-4 w-full text-left text-sm">
          <thead className="text-xs text-text-tertiary">
            <tr><th className="py-2">名称</th><th className="py-2">动作</th><th className="py-2">计划</th><th className="py-2">状态</th><th className="py-2">上次运行</th></tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {extra.timming.map((t) => (
              <tr key={t.id}>
                <td className="py-2 text-text-secondary">{t.name}</td>
                <td className="py-2 text-text-tertiary">{t.action}</td>
                <td className="py-2 text-text-tertiary">{timingScheduleLabel(t)}</td>
                <td className="py-2 text-text-tertiary">{t.enabled ? "启用" : "停用"}</td>
                <td className="py-2 text-text-tertiary">{t.lastRun ? fmtTime(t.lastRun, true) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <CronRunButton />
      </div>
      <TimingQuickAdd tasks={extra.timming} defaultApi={LZ_API} sources={sources} />
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-3 font-semibold text-text-primary">编辑任务（JSON）</h2>
        <JsonEditorForm
          field="timming"
          initial={extra.timming}
          rows={16}
          submitText="保存任务"
          help={`action 支持 collect（采集）、revalidate（刷新缓存）、resetHits（清零日/周/月点击）。定时字段：schedule 为 interval/daily/weekly；daily/weekly 使用 time（HH:mm）和 weekdays（0=周日…6=周六）；collect 的 params 支持 {"api":"...","pages":30,"typeId":6,"hours":24,"markLevel":true}，未填 hours 时每天任务自动 24、每周任务自动 168。`}
        />
      </div>
    </div>
  );
}