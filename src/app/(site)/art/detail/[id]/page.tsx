import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const art = await prisma.art.findUnique({ where: { artId: Number(id) } });
  return { title: art?.artName || "影视资讯", description: art?.artBlurb || "" };
}

export default async function ArtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artId = Number(id);
  const art = await prisma.art.findUnique({ where: { artId } });
  if (!art) notFound();
  await prisma.art.update({ where: { artId }, data: { artHits: { increment: 1 } } });
  const [type, more] = await Promise.all([
    prisma.type.findUnique({ where: { typeId: art.typeId } }),
    prisma.art.findMany({ where: { artStatus: 1, artId: { not: artId } }, orderBy: { artTime: "desc" }, take: 6 }),
  ]);

  return (
    <div className="container">
      <div className="left_row fl">
        <div className="pannel clearfix">
          <div className="pannel_head clearfix">
            <h2 className="title">{art.artName}</h2>
          </div>
          <div className="art_info" style={{ color: "#999", fontSize: "0.3rem", padding: "0.2rem 0" }}>
            {type?.typeName} · {new Date(art.artTime * 1000).toLocaleString("zh-CN")} · {art.artHits} 阅读
          </div>
          {art.artPic ? (
            <div
              style={{
                width: "100%",
                maxHeight: "5rem",
                backgroundImage: `url(${poster(art.artPic)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "6px",
                height: "4rem",
                marginBottom: "0.3rem",
              }}
            />
          ) : null}
          <div
            className="art_content"
            style={{ fontSize: "0.36rem", lineHeight: 1.9, color: "#444" }}
            dangerouslySetInnerHTML={{ __html: art.artContent || "<p>暂无内容</p>" }}
          />
        </div>
      </div>
      <div className="right_row fr pa_left hidden_xs hidden_mi">
        <div className="pannel clearfix">
          <div className="pannel_head clearfix">
            <h3 className="title">相关阅读</h3>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {more.map((a) => (
              <li key={a.artId} style={{ padding: "0.15rem 0", borderBottom: "1px dashed #f0f0f0" }}>
                <Link href={`/art/detail/${a.artId}`} className="text_muted" style={{ fontSize: "0.3rem" }}>
                  {a.artName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}