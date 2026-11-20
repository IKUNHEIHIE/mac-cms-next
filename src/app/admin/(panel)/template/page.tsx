import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "模板管理" };

const PAGES = [
  ["首页", "/", "index/index.html"],
  ["视频列表", "/vod/type/[id]", "vod/show.html + module/typeqt.html"],
  ["视频详情", "/vod/detail/[id]", "vod/detail.html"],
  ["播放页", "/vod/play/[id]/[sid]/[nid]", "vod/play.html"],
  ["搜索页", "/vod/search", "vod/search.html"],
  ["文章列表", "/art/type/[id]", "art/type.html"],
  ["文章详情", "/art/detail/[id]", "art/detail.html"],
  ["专题", "/topic", "topic/index.html"],
  ["演员", "/actor/[id]", "actor/detail.html"],
  ["会员中心", "/user", "user/index.html"],
];

export default async function TemplatePage() {
  const settings = await getSettings();
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary">模板管理</h1>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Conch 影视主题</h2>
            <p className="mt-1 text-sm text-text-tertiary">792.zip 前台模板 · 已重写为 React Server Components</p>
          </div>
          <Link href="/admin/setting" className="h-9 rounded-lg bg-primary-500 px-4 text-sm leading-9 text-white">主题设置</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-text-secondary md:grid-cols-4">
          <div className="rounded-lg bg-background-gray-primary p-3">当前主题：{settings.theme.name}</div>
          <div className="rounded-lg bg-background-gray-primary p-3">主题色：{settings.theme.color}</div>
          <div className="rounded-lg bg-background-gray-primary p-3">首页轮播：{settings.theme.banner ? "开启" : "关闭"}</div>
          <div className="rounded-lg bg-background-gray-primary p-3">导航分类数：{settings.theme.navIds.length}</div>
        </div>
      </div>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-3 font-semibold text-text-primary">页面与模板对照</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-text-tertiary">
            <tr><th className="py-2">页面</th><th className="py-2">路由</th><th className="py-2">原模板文件</th></tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {PAGES.map(([name, route, file]) => (
              <tr key={route}>
                <td className="py-2 text-text-secondary">{name}</td>
                <td className="py-2"><Link href={route} target="_blank" className="text-primary-500">{route}</Link></td>
                <td className="py-2 text-text-tertiary">{file}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-7 text-blue-700">
        原苹果CMS模板引擎的 {`{maccms:vod}`}、{`{maccms:type}`} 等标签，已改写为服务端数据库查询与 React 组件；
        静态资源沿用 792 主题的 CSS / 字体 / 图标，视觉保持 1:1。
      </div>
    </div>
  );
}