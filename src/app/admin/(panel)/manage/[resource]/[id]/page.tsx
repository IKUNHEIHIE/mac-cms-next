import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResource } from "@/lib/adminResources";
import ResourceForm from "@/components/admin/ResourceForm";

export const dynamic = "force-dynamic";

export default async function ResourceEditPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const def = getResource(resource);
  if (!def) notFound();
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) notFound();
  const db = (prisma as unknown as Record<string, unknown>)[def.model] as {
    findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  };
  const row = await db.findUnique({ where: { [def.idField]: idNum } });
  if (!row) notFound();
  const initial: Record<string, string> = {};
  for (const f of def.fields) {
    const v = row[f.key];
    initial[f.key] = v === null || v === undefined ? "" : String(v);
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/admin/manage/${def.key}`} className="text-sm text-text-tertiary hover:text-primary-500">
          ← 返回{def.label}列表
        </Link>
        <h1 className="text-xl font-bold text-text-primary">
          编辑{def.label} #{id}
        </h1>
      </div>
      <ResourceForm def={def} id={idNum} initial={initial} />
    </div>
  );
}