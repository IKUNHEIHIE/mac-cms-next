import Link from "next/link";
import { prisma } from "@/lib/db";
import ImportForm from "@/components/admin/ImportForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "数据库" };

const TABLES: { label: string; model: string }[] = [
  { label: "影片", model: "vod" },
  { label: "分类", model: "type" },
  { label: "文章", model: "art" },
  { label: "专题", model: "topic" },
  { label: "演员", model: "actor" },
  { label: "角色", model: "role" },
  { label: "漫画", model: "manga" },
  { label: "网址", model: "website" },
  { label: "会员", model: "user" },
  { label: "会员组", model: "group" },
  { label: "订单", model: "order" },
  { label: "充值卡", model: "card" },
  { label: "提现", model: "cash" },
  { label: "积分日志", model: "plog" },
  { label: "评论", model: "comment" },
  { label: "留言", model: "gbook" },
  { label: "友情链接", model: "link" },
  { label: "采集节点", model: "collect" },
  { label: "管理员", model: "admin" },
  { label: "附件", model: "annex" },
  { label: "访问日志", model: "visit" },
  { label: "播放日志", model: "ulog" },
];

export default async function DatabasePage() {
  const counts = await Promise.all(
    TABLES.map(async (t) => {
      const db = (prisma as unknown as Record<string, { count: () => Promise<number> }>)[t.model];
      return { ...t, count: await db.count() };
    }),
  );
  const version = await prisma.$queryRaw<{ v: string }[]>`SELECT VERSION() AS v`.catch(() => [{ v: "unknown" }]);
  const dbUrl = process.env.DATABASE_URL || "";
  const dbName = dbUrl.replace(/^mysql:\/\/[^/]+\//, "").split("?")[0] || "-";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">数据库</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            MySQL {version[0]?.v || ""} · 数据库 {dbName} · 表前缀 mac_
          </p>
        </div>
        <a href="/api/admin/export" className="h-9 rounded-lg bg-primary-500 px-4 text-sm font-medium leading-9 text-white hover:opacity-90">
          导出 JSON 备份
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {counts.map((c) => (
          <div key={c.model} className="rounded-xl border border-card-border bg-card-surface-area p-4">
            <p className="text-xl font-bold text-text-primary">{c.count}</p>
            <p className="text-xs text-text-tertiary">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-card-border bg-card-surface-area p-5 text-sm leading-7 text-text-secondary">
        <p><strong>数据库连接：</strong>{dbUrl.replace(/:\/\/([^:]+):[^@]*@/, "://$1:***@")}</p>
        <p><strong>备份说明：</strong>导出文件为 JSON，包含除搜索缓存外的全部业务表，可用于迁移与审计。</p>
        <p><strong>切换数据库：</strong>修改 <code>.env</code> 中的 DATABASE_URL 后执行 <code>npx prisma db push</code> 与 <code>npx prisma db seed</code>。</p>
        <p>
          <Link href="/admin/setting" className="text-primary-500">前往系统设置 →</Link>
        </p>
      </div>
      <ImportForm />
    </div>
  );
}