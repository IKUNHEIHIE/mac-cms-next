import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResource } from "@/lib/adminResources";
import ResourceForm from "@/components/admin/ResourceForm";
import CollectBindForm from "@/components/admin/CollectBindForm";
import CollectPlayerUploader from "@/components/admin/CollectPlayerUploader";

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
  const localTypes =
    def.key === "collect"
      ? await prisma.type.findMany({
          orderBy: { typeSort: "asc" },
          select: { typeId: true, typeName: true, typePid: true, typeMid: true },
        })
      : [];
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
      {def.key === "collect" ? (
        <div className="space-y-3 pt-2">
          <div>
            <h2 className="text-lg font-bold text-text-primary">采集分类绑定</h2>
            <p className="mt-1 text-sm text-text-tertiary">
              把资源站分类映射到本站分类；绑定按接口地址保存，同接口的所有节点共用。未绑定时沿用资源站原分类 ID。
            </p>
          </div>
          {String(row.collectUrl || "").trim() ? (
            <CollectBindForm initialApi={String(row.collectUrl)} localTypes={localTypes} lockApi autoLoad />
          ) : (
            <p className="text-sm text-text-tertiary">请先保存资源站接口地址，再配置分类绑定。</p>
          )}
          <CollectPlayerUploader
            collectId={idNum}
            initial={{
              name: String(row.collectPlayerName || ""),
              from: String(row.collectPlayerFrom || ""),
              file: String(row.collectPlayerFile || ""),
              type: String(row.collectPlayerType || ""),
              status: Number(row.collectPlayerStatus) || 0,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}