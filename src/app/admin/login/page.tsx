import AdminLoginForm from "@/components/admin/AdminLoginForm";
import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "后台登录" };

export default async function AdminLoginPage() {
  const { site } = await getSettings();
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0f1020] via-[#1b1c33] to-[#2a1a3d] p-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-card-surface-area p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-xl font-bold text-white">
            M
          </div>
          <h1 className="text-xl font-bold text-text-primary">MAC CMS 管理后台</h1>
          <p className="mt-1 text-sm text-text-tertiary">TypeScript + Next.js 重构版</p>
        </div>
        <AdminLoginForm adminPath={site.adminPath} />
        <div className="mt-6 text-center text-xs">
          <Link href="/" className="text-text-tertiary hover:text-primary-500">
            ← 返回网站首页
          </Link>
        </div>
      </div>
    </div>
  );
}