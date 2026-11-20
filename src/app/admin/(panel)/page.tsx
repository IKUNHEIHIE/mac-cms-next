import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "控制台" };

const CARDS = [
  { key: "vod", label: "影片总数", href: "/admin/manage/vod", color: "from-[#5750F1] to-[#8b7bff]" },
  { key: "user", label: "会员总数", href: "/admin/manage/user", color: "from-[#ff5f00] to-[#ff9a5f]" },
  { key: "comment", label: "评论总数", href: "/admin/manage/comment", color: "from-[#00b8a9] to-[#66dcd0]" },
  { key: "order", label: "订单总数", href: "/admin/manage/order", color: "from-[#f6416c] to-[#ff9a9e]" },
] as const;

export default async function AdminDashboard() {
  const [vodCount, userCount, commentCount, orderCount, todayVod, latestVods, latestUsers, latestComments, gbookCount, typeCount] =
    await Promise.all([
      prisma.vod.count(),
      prisma.user.count(),
      prisma.comment.count(),
      prisma.order.count(),
      prisma.vod.count({ where: { vodTime: { gte: Math.floor(Date.now() / 1000) - 86400 } } }),
      prisma.vod.findMany({ orderBy: { vodTime: "desc" }, take: 8, select: { vodId: true, vodName: true, vodTime: true, vodRemarks: true } }),
      prisma.user.findMany({ orderBy: { userRegTime: "desc" }, take: 6, select: { userId: true, userName: true, userPoints: true, userRegTime: true } }),
      prisma.comment.findMany({ orderBy: { commentTime: "desc" }, take: 6, select: { commentId: true, commentName: true, commentContent: true, commentTime: true } }),
      prisma.gbook.count({ where: { gbookStatus: 1 } }),
      prisma.type.count(),
    ]);
  const counts: Record<string, number> = { vod: vodCount, user: userCount, comment: commentCount, order: orderCount };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">控制台</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            今日新增 {todayVod} 部影片 · 共 {typeCount} 个分类 · {gbookCount} 条公开留言
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="h-9 rounded-lg border border-card-border px-4 text-sm leading-9 text-text-secondary hover:bg-background-gray-primary">
            打开前台
          </Link>
          <Link href="/admin/collect" className="h-9 rounded-lg bg-primary-500 px-4 text-sm font-medium leading-9 text-white hover:opacity-90">
            一键采集
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.key} href={c.href} className="group overflow-hidden rounded-2xl border border-card-border bg-card-surface-area p-5 transition hover:shadow-md">
            <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>●</div>
            <p className="text-3xl font-bold text-text-primary">{counts[c.key]}</p>
            <p className="mt-1 text-sm text-text-tertiary">{c.label} →</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">最新影片</h2>
            <Link href="/admin/manage/vod" className="text-sm text-primary-500">查看全部</Link>
          </div>
          <ul className="divide-y divide-card-border">
            {latestVods.map((v) => (
              <li key={v.vodId} className="flex items-center justify-between py-2.5 text-sm">
                <Link href={`/admin/manage/vod/${v.vodId}`} className="max-w-[70%] truncate text-text-secondary hover:text-primary-500">
                  {v.vodName}
                </Link>
                <span className="text-xs text-text-tertiary">{fmtTime(v.vodTime)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">最新会员</h2>
            <Link href="/admin/manage/user" className="text-sm text-primary-500">查看全部</Link>
          </div>
          <ul className="divide-y divide-card-border">
            {latestUsers.map((u) => (
              <li key={u.userId} className="flex items-center justify-between py-2.5 text-sm">
                <Link href={`/admin/manage/user/${u.userId}`} className="text-text-secondary hover:text-primary-500">
                  {u.userName}
                </Link>
                <span className="text-xs text-text-tertiary">{u.userPoints} 积分 · {fmtTime(u.userRegTime)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-card-border bg-card-surface-area p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">最新评论</h2>
            <Link href="/admin/manage/comment" className="text-sm text-primary-500">审核评论</Link>
          </div>
          <ul className="divide-y divide-card-border">
            {latestComments.map((c) => (
              <li key={c.commentId} className="py-2.5 text-sm">
                <span className="font-medium text-text-secondary">{c.commentName || "游客"}</span>
                <span className="ml-2 text-text-tertiary">{c.commentContent}</span>
                <span className="float-right text-xs text-text-tertiary">{fmtTime(c.commentTime, true)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { href: "/admin/manage/type", label: "分类管理" },
          { href: "/admin/setting", label: "系统设置" },
          { href: "/admin/database", label: "数据备份" },
          { href: "/admin/login", label: "切换账号" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="rounded-xl border border-card-border bg-card-surface-area p-4 text-center text-sm text-text-secondary hover:border-primary-500 hover:text-primary-500">
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}