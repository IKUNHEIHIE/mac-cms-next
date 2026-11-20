import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";
import { isRequestBlocked } from "@/lib/extraSettings";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  if (await isRequestBlocked()) {
    return <div className="p-10 text-center text-text-secondary">当前 IP 已被安全策略限制，请调整安全设置后重试。</div>;
  }
  const session = await getSessionAdmin();
  if (!session) redirect("/admin/login");
  const admin = await prisma.admin.findUnique({ where: { adminId: session.aid } });
  if (!admin || admin.adminStatus !== 1) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}