import Link from "next/link";
import { prisma } from "@/lib/db";
import { LZ_API } from "@/lib/collect";
import CollectForm from "@/components/admin/CollectForm";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "资源采集" };

export default async function CollectPage() {
  const [sources, vodCount, lastVod] = await Promise.all([
    prisma.collect.findMany({ orderBy: { collectId: "asc" } }),
    prisma.vod.count(),
    prisma.vod.findFirst({ orderBy: { vodTime: "desc" }, select: { vodTime: true, vodName: true } }),
  ]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">资源采集</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            当前影片 {vodCount} 部，最近更新：{lastVod ? `${lastVod.vodName}（${fmtTime(lastVod.vodTime, true)}）` : "暂无"}
          </p>
        </div>
        <Link href="/admin/manage/collect" className="text-sm text-primary-500">
          管理采集节点 →
        </Link>
      </div>

      <CollectForm defaultApi={LZ_API} />

      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-4 font-semibold text-text-primary">已保存的采集节点</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-text-tertiary">
            <tr>
              <th className="py-2">名称</th>
              <th className="py-2">接口</th>
              <th className="py-2">模块</th>
              <th className="py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {sources.map((s) => (
              <tr key={s.collectId}>
                <td className="py-2.5 text-text-secondary">{s.collectName}</td>
                <td className="max-w-[380px] truncate py-2.5 text-text-tertiary">{s.collectUrl}</td>
                <td className="py-2.5 text-text-tertiary">{s.collectMid === 1 ? "视频" : "文章"}</td>
                <td className="py-2.5 text-right">
                  <Link href={`/admin/manage/collect/${s.collectId}`} className="text-xs text-primary-500">编辑</Link>
                </td>
              </tr>
            ))}
            {sources.length === 0 ? <tr><td colSpan={4} className="py-6 text-center text-text-tertiary">暂无节点</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-7 text-blue-700">
        <strong>采集说明：</strong>
        本功能兼容苹果CMS v10 资源站接口（ac=list / ac=detail），会自动下载分类、影片、播放地址与演员信息。
        先在资源站确认接口可访问，再导入分类，最后按需采集页数。重复采集会按影片 ID 自动更新，不会产生重复数据。
      </div>
    </div>
  );
}