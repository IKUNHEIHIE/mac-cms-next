import Link from "next/link";
import { prisma } from "@/lib/db";
import { LZ_API } from "@/lib/collect";
import CollectForm from "@/components/admin/CollectForm";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "添加采集节点" };

export default async function CollectPage() {
  const [vodCount, lastVod] = await Promise.all([
    prisma.vod.count(),
    prisma.vod.findFirst({ orderBy: { vodTime: "desc" }, select: { vodTime: true, vodName: true } }),
  ]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">添加采集节点</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            当前影片 {vodCount} 部，最近更新：{lastVod ? `${lastVod.vodName}（${fmtTime(lastVod.vodTime, true)}）` : "暂无"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/manage/collect" className="text-primary-500">管理采集节点 →</Link>
        </div>
      </div>

      <CollectForm defaultApi={LZ_API} />


      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-7 text-blue-700">
        <strong>采集说明：</strong>
        本功能兼容苹果CMS v10 资源站接口（ac=list / ac=detail），会自动下载分类、影片、播放地址与演员信息。
        先在资源站确认接口可访问，再导入分类，最后按需采集页数。重复采集会按影片 ID 自动更新，不会产生重复数据。
      </div>
    </div>
  );
}