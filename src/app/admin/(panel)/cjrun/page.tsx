import Link from "next/link";
import { prisma } from "@/lib/db";
import CjRunButton from "@/components/admin/CjRunButton";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "文章采集" };

export default async function CjRunPage() {
  const nodes = await prisma.cjNode.findMany({ orderBy: { nodeid: "asc" } });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">文章采集</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            按节点规则抓取列表页与正文，入库到文章分类。采集记录做 MD5 去重。
          </p>
        </div>
        <Link href="/admin/manage/cjnode/new" className="h-9 rounded-lg bg-primary-500 px-4 text-sm font-medium leading-9 text-white">
          + 新增采集节点
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-card-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-gray-primary text-xs text-text-tertiary">
            <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">名称</th><th className="px-4 py-3">列表页模板</th><th className="px-4 py-3">上次采集</th><th className="px-4 py-3 text-right">操作</th></tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {nodes.map((n) => (
              <tr key={n.nodeid}>
                <td className="px-4 py-3 text-text-tertiary">{n.nodeid}</td>
                <td className="px-4 py-3 text-text-secondary">{n.name}</td>
                <td className="max-w-[420px] truncate px-4 py-3 text-text-tertiary">{n.urlpage || "未配置"}</td>
                <td className="px-4 py-3 text-text-tertiary">{n.lastdate ? fmtTime(n.lastdate, true) : "-"}</td>
                <td className="px-4 py-3 text-right">
                  <CjRunButton nodeid={n.nodeid} />
                  <Link href={`/admin/manage/cjnode/${n.nodeid}`} className="ml-2 text-xs text-primary-500">编辑</Link>
                </td>
              </tr>
            ))}
            {nodes.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-text-tertiary">暂无采集节点</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-7 text-blue-700">
        <strong>规则说明：</strong>列表页地址可用 <code>(*)</code> 表示页码；标题/正文使用正则表达式并取第一个捕获组，留空则用内置默认规则；
        URL 必须包含/排除支持多个关键词（排除用 <code>|</code> 分隔）。每次最多抓取 30 篇，避免对目标站造成压力。
      </div>
    </div>
  );
}