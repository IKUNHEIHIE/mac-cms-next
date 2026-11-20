import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vod = await prisma.vod.findUnique({ where: { vodId: Number(id) } });
  return { title: vod ? `${vod.vodName} 分集剧情` : "分集剧情" };
}

export default async function PlotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const vod = await prisma.vod.findUnique({ where: { vodId: Number(id) } });
  if (!vod) notFound();
  const names = (vod.vodPlotName || "").split(/\$\$\$|\r?\n/).map((s) => s.trim()).filter(Boolean);
  const details = (vod.vodPlotDetail || "").split(/\$\$\$|\r?\n/).map((s) => s.trim());
  const total = Math.max(names.length, details.length);
  const page = Math.max(1, Number(sp.page) || 1);
  const size = 20;
  const start = (page - 1) * size;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const rows = Array.from({ length: Math.min(size, Math.max(0, total - start)) }, (_, i) => ({
    name: names[start + i] || `第${start + i + 1}集`,
    detail: details[start + i] || "暂无剧情介绍",
  }));

  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <Link className="text_muted pull_right" href={`/vod/detail/${vod.vodId}`}>返回详情</Link>
          <h2 className="title">{vod.vodName} · 分集剧情</h2>
        </div>
        {total === 0 ? <div className="show_no">暂无分集剧情</div> : null}
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {rows.map((r, i) => (
            <li key={i} style={{ padding: "0.25rem 0", borderBottom: "1px dashed #f0f0f0", lineHeight: 1.9 }}>
              <strong style={{ color: "#333" }}>{r.name}</strong>
              <span style={{ color: "#666", marginLeft: "0.2rem" }}>{r.detail}</span>
            </li>
          ))}
        </ul>
        {pageCount > 1 ? (
          <div className="mac_pages">
            <div className="page_info">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <Link key={p} className={`page_link${p === page ? " page_current" : ""}`} href={`/plot/${vod.vodId}?page=${p}`}>
                  {p}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}