import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Pagination from "@/components/site/Pagination";
import { pageParam } from "@/lib/site";
import { poster } from "@/lib/maccms";
import { typeSeoFor } from "@/lib/typeSeo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const type = await prisma.type.findUnique({ where: { typeId: Number(id) } });
  if (!type) return { title: "影视资讯" };
  const seo = typeSeoFor(type.typeId, type.typeName);
  return { title: type.typeTitle || seo.title, description: type.typeDes || seo.description, keywords: type.typeKey || seo.keywords };
}

export default async function ArtTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const typeId = Number(id);
  const type = await prisma.type.findUnique({ where: { typeId } });
  if (!type) notFound();
  const page = pageParam(sp.page);
  const size = 12;
  const [total, list] = await Promise.all([
    prisma.art.count({ where: { typeId, artStatus: 1 } }),
    prisma.art.findMany({ where: { typeId, artStatus: 1 }, orderBy: { artTime: "desc" }, skip: (page - 1) * size, take: size }),
  ]);
  const seo = typeSeoFor(type.typeId, type.typeName);
  const intro = type.typeDes || seo.description;
  const pageCount = Math.max(1, Math.ceil(total / size));
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <span className="pull_right">共 {total} 篇文章</span>
          <h2 className="title">{type.typeName}</h2>
        </div>
        <p className="mc_type_intro">{intro}</p>
        <ul className="artlist clearfix" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {list.map((a) => (
            <li key={a.artId} className="artlist_item" style={{ padding: "0.25rem 0", borderBottom: "1px dashed #f0f0f0" }}>
              <Link href={`/art/detail/${a.artId}`} style={{ display: "flex", gap: "0.3rem" }}>
                <span
                  className="artlist_thumb"
                  style={{
                    width: "2.6rem",
                    height: "1.6rem",
                    flex: "none",
                    backgroundImage: `url(${poster(a.artPic)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "4px",
                  }}
                />
                <span style={{ flex: 1 }}>
                  <p className="artlist_title" style={{ margin: "0 0 0.15rem", fontSize: "0.4rem", color: "#333" }}>
                    {a.artName}
                  </p>
                  <p className="artlist_blurb" style={{ margin: 0, color: "#999", fontSize: "0.32rem" }}>
                    {a.artBlurb}
                  </p>
                  <p style={{ margin: "0.15rem 0 0", color: "#bbb", fontSize: "0.28rem" }}>
                    {new Date(a.artTime * 1000).toLocaleDateString("zh-CN")} · {a.artHits} 阅读
                  </p>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 ? <div className="show_no">暂无文章</div> : null}
        <Pagination page={page} pageCount={pageCount} basePath={`/art/type/${typeId}`} />
      </div>
    </div>
  );
}