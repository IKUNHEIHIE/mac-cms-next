import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/lib/adminResources";
import ResourceForm from "@/components/admin/ResourceForm";

export const dynamic = "force-dynamic";

export default async function ResourceNewPage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();
  const initial: Record<string, string> = {};
  for (const f of def.fields) initial[f.key] = f.key === def.idField ? "" : "";
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/admin/manage/${def.key}`} className="text-sm text-text-tertiary hover:text-primary-500">
          ← 返回{def.label}列表
        </Link>
        <h1 className="text-xl font-bold text-text-primary">新增{def.label}</h1>
      </div>
      <ResourceForm def={def} initial={initial} />
    </div>
  );
}