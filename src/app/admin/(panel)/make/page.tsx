import { prisma } from "@/lib/db";
import RefreshButton from "@/components/admin/RefreshButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "缓存与生成" };

export default async function MakePage() {
  const [vods, arts] = await Promise.all([prisma.vod.count(), prisma.art.count()]);
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary">缓存与生成</h1>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <p className="mb-4 text-sm leading-7 text-text-secondary">
          原苹果CMS支持生成静态 HTML。本项目采用 Next.js 服务端渲染（SSR），页面始终读取最新数据库内容，
          不需要逐页生成静态文件；当启用生产缓存时可在此一键刷新全站缓存。
        </p>
        <RefreshButton />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-card-border bg-card-surface-area p-5">
          <p className="text-2xl font-bold text-text-primary">{vods}</p>
          <p className="text-sm text-text-tertiary">影片</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-surface-area p-5">
          <p className="text-2xl font-bold text-text-primary">{arts}</p>
          <p className="text-sm text-text-tertiary">文章</p>
        </div>
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-7 text-blue-700">
        定时任务、URL 推送、镜像域名等原系统工具，在 Next.js 部署环境中分别由平台 Cron、Search Console / 百度推送 API、
        反向代理与 CDN 配置承担；如需恢复为后台可视化配置，可在「系统设置」中扩展。
      </div>
    </div>
  );
}