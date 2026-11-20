import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "系统信息" };

export default async function UpdatePage() {
  const pkg = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8"));
  const version = await prisma.$queryRaw<{ v: string }[]>`SELECT VERSION() AS v`.catch(() => [{ v: "unknown" }]);
  const [vods, users] = await Promise.all([prisma.vod.count(), prisma.user.count()]);
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary">系统信息</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
          <h2 className="mb-3 font-semibold text-text-primary">运行环境</h2>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>应用版本：{pkg.version}</li>
            <li>Node.js：{process.version}</li>
            <li>Next.js：{pkg.dependencies.next}</li>
            <li>React：{pkg.dependencies.react}</li>
            <li>MySQL：{version[0]?.v}</li>
            <li>Prisma：{pkg.devDependencies.prisma}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
          <h2 className="mb-3 font-semibold text-text-primary">数据概况</h2>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>影片：{vods}</li>
            <li>会员：{users}</li>
            <li>前台主题：Conch（792）</li>
            <li>后台模板：NextAdmin Dashboard v2</li>
            <li>数据接口：/api/provide/vod（兼容苹果CMS v10）</li>
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-card-border bg-card-surface-area p-5 text-sm leading-7 text-text-secondary">
        <p><strong>升级方式：</strong>拉取最新代码后执行 <code>npm install</code>、<code>npx prisma db push</code>、<code>npm run build</code>。</p>
        <p><strong>安全建议：</strong>上线前修改默认管理员密码、在 .env 设置强随机 AUTH_SECRET，并关闭演示支付。</p>
      </div>
    </div>
  );
}