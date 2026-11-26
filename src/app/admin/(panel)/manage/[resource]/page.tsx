import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResource, defaultOrder } from "@/lib/adminResources";
import { fmtTime } from "@/lib/maccms";
import DeleteButton from "@/components/admin/DeleteButton";
import CollectNodeActions from "@/components/admin/CollectNodeActions";

export const dynamic = "force-dynamic";

export default async function ResourceListPage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { resource } = await params;
  const sp = await searchParams;
  const def = getResource(resource);
  if (!def) notFound();
  const page = Math.max(1, Number(sp.page) || 1);
  const size = def.key === "type" ? 50 : 20;
  const q = (sp.q || "").trim();
  const where: Record<string, unknown> = {};
  if (q && def.searchFields.length) {
    where.OR = def.searchFields.map((f) => ({ [f]: { contains: q } }));
    if (/^\d+$/.test(q)) (where.OR as unknown[]).push({ [def.idField]: Number(q) });
  }
  const db = (prisma as unknown as Record<string, unknown>)[def.model] as {
    findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
    count: (args: unknown) => Promise<number>;
  };
  let total: number;
  let list: Record<string, unknown>[];
  if (def.key === "type") {
    const all = (await db.findMany({ where, orderBy: { typeSort: "asc" }, take: 500 })) as Record<string, unknown>[];
    const bySort = (a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.typeSort) - Number(b.typeSort);
    const parents = all.filter((r) => Number(r.typePid) === 0).sort(bySort);
    const ordered: Record<string, unknown>[] = [];
    for (const p of parents) {
      ordered.push(p);
      ordered.push(...all.filter((r) => Number(r.typePid) === Number(p.typeId)).sort(bySort));
    }
    for (const r of all) if (!ordered.includes(r)) ordered.push(r);
    total = all.length;
    list = ordered.slice((page - 1) * size, page * size);
  } else {
    [total, list] = await Promise.all([
      db.count({ where }),
      db.findMany({ where, orderBy: defaultOrder(def), skip: (page - 1) * size, take: size }),
    ]);
  }
  const pageCount = Math.max(1, Math.ceil(total / size));
  const typeRows = def.columns.some((c) => c.kind === "type")
    ? await prisma.type.findMany({ select: { typeId: true, typeName: true } })
    : [];
  const typeMap = new Map(typeRows.map((t) => [t.typeId, t.typeName]));

  const fmt = (col: (typeof def.columns)[number], row: Record<string, unknown>) => {
    const v = row[col.key];
    if (v === null || v === undefined) return "-";
    if (col.kind === "time") return fmtTime(Number(v), true);
    if (col.kind === "bool") {
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs ${Number(v) === 1 ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
          {Number(v) === 1 ? "启用" : "禁用"}
        </span>
      );
    }
    if (col.kind === "type") return Number(v) === 0 ? "顶级" : typeMap.get(Number(v)) || String(v);
    if (col.kind === "system") return <span className={`rounded-full px-2 py-0.5 text-xs ${Number(v) === 1 ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{Number(v) === 1 ? "系统默认" : "-"}</span>;
    if (def.key === "type" && col.key === "typeName" && Number(row.typePid) > 0) {
      return <span><span className="pr-1 text-text-tertiary">└</span>{String(v)}</span>;
    }
    if (col.kind === "truncate") return String(v).slice(0, 40);
    return String(v);
  };

  const mk = (p: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return `/admin/manage/${def.key}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{def.label}管理</h1>
          <p className="mt-1 text-sm text-text-tertiary">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-3">
          <form action={`/admin/manage/${def.key}`} className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="搜索…"
              className="h-9 w-56 rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm outline-none focus:border-primary-500"
            />
            <button type="submit" className="h-9 rounded-lg border border-card-border px-4 text-sm text-text-secondary hover:bg-background-gray-primary">
              搜索
            </button>
          </form>
          <Link
            href={`/admin/manage/${def.key}/new`}
            className="h-9 rounded-lg bg-primary-500 px-4 text-sm font-medium leading-9 text-white hover:opacity-90"
          >
            + 新增
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-card-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-background-gray-primary text-xs uppercase text-text-tertiary">
              <tr>
                {def.columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-3 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {list.map((row) => (
                <tr key={String(row[def.idField])} className="hover:bg-background-gray-primary/60">
                  {def.columns.map((c) => (
                    <td key={c.key} className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {fmt(c, row)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {def.key === "collect" ? (
                      <CollectNodeActions
                        nodeId={Number(row.collectId)}
                        nodeName={String(row.collectName || "")}
                        format={Number(row.collectType) === 1 ? "xml" : Number(row.collectType) === 2 ? "json" : "auto"}
                      />
                    ) : null}
                    <Link
                      href={`/admin/manage/${def.key}/${row[def.idField]}`}
                      className="mr-1 rounded-md px-2 py-1 text-xs text-primary-500 hover:bg-background-gray-primary"
                    >
                      编辑
                    </Link>
                    {def.key === "type" && Number(row.typeSystem) === 1 ? (
                      <span className="text-xs text-text-tertiary">默认分组</span>
                    ) : (
                      <DeleteButton resource={def.key} id={Number(row[def.idField])} />
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td colSpan={def.columns.length + 1} className="px-4 py-10 text-center text-text-tertiary">
                    暂无数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={mk(page - 1)} className="rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-background-gray-primary">
              上一页
            </Link>
          ) : null}
          <span className="px-2 text-sm text-text-tertiary">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={mk(page + 1)} className="rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-background-gray-primary">
              下一页
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}