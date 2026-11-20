import { getExtra } from "@/lib/extraSettings";
import JsonEditorForm from "@/components/admin/JsonEditorForm";
import CronRunButton from "@/components/admin/CronRunButton";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "定时任务" };

export default async function TimmingPage() {
  const extra = await getExtra();
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
            <tr><th className="py-2">名称</th><th className="py-2">动作</th><th className="py-2">间隔(分钟)</th><th className="py-2">状态</th><th className="py-2">上次运行</th></tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {extra.timming.map((t) => (
              <tr key={t.id}>
                <td className="py-2 text-text-secondary">{t.name}</td>
                <td className="py-2 text-text-tertiary">{t.action}</td>
                <td className="py-2 text-text-tertiary">{t.intervalMinutes}</td>
                <td className="py-2 text-text-tertiary">{t.enabled ? "启用" : "停用"}</td>
                <td className="py-2 text-text-tertiary">{t.lastRun ? fmtTime(t.lastRun, true) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <CronRunButton />
      </div>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-3 font-semibold text-text-primary">编辑任务（JSON）</h2>
        <JsonEditorForm
          field="timming"
          initial={extra.timming}
          rows={16}
          submitText="保存任务"
          help={`action 支持 collect（采集，params 为 {"api":"...","pages":1,"typeId":6,"markLevel":true}）、revalidate（刷新缓存）、resetHits（清零日/周/月点击）。`}
        />
      </div>
    </div>
  );
}