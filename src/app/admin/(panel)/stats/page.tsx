import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "数据统计" };

export default async function StatsPage() {
  const now = Math.floor(Date.now() / 1000);
  const days = Array.from({ length: 14 }, (_, i) => now - (13 - i) * 86400);
  const start = days[0];
  const vods = await prisma.vod.findMany({ where: { vodTime: { gte: start } }, select: { vodTime: true } });
  const users = await prisma.user.findMany({ where: { userRegTime: { gte: start } }, select: { userRegTime: true } });
  const bucket = (times: number[]) => {
    const arr = new Array(14).fill(0);
    for (const t of times) {
      const idx = Math.floor((t - start) / 86400);
      if (idx >= 0 && idx < 14) arr[idx]++;
    }
    return arr;
  };
  const vd = bucket(vods.map((v) => v.vodTime));
  const ud = bucket(users.map((u) => u.userRegTime));
  const max = Math.max(1, ...vd, ...ud);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">数据统计</h1>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-6">
        <h2 className="mb-6 font-semibold text-text-primary">最近 14 天新增影片 / 会员</h2>
        <div className="flex h-64 items-end gap-2">
          {vd.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 200 }}>
                <div className="w-1/2 rounded-t bg-primary-500" style={{ height: `${(v / max) * 100}%` }} title={`影片 ${v}`} />
                <div className="w-1/2 rounded-t bg-[#ff8a3d]" style={{ height: `${(ud[i] / max) * 100}%` }} title={`会员 ${ud[i]}`} />
              </div>
              <span className="text-[10px] text-text-tertiary">
                {new Date(days[i] * 1000).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-6 text-sm text-text-secondary">
          <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded bg-primary-500" />新增影片</span>
          <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded bg-[#ff8a3d]" />新增会员</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "影片", value: await prisma.vod.count() },
          { label: "会员", value: await prisma.user.count() },
          { label: "评论", value: await prisma.comment.count() },
          { label: "采集节点", value: await prisma.collect.count() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-card-border bg-card-surface-area p-5">
            <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="text-sm text-text-tertiary">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}