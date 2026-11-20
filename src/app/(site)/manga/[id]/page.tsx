import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.manga.findUnique({ where: { mangaId: Number(id) } });
  if (!m) notFound();
  const chapters = (m.mangaChapterUrl || "")
    .split("#")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf("$");
      return { name: i > 0 ? s.slice(0, i) : s, url: i > 0 ? s.slice(i + 1) : s };
    });
  return (
    <div className="container">
      <div className="pannel clearfix" style={{ paddingTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <div style={{ width: "4rem", height: "5.2rem", flex: "none", borderRadius: 8, backgroundImage: `url(${poster(m.mangaPic)})`, backgroundSize: "cover" }} />
          <div>
            <h1 style={{ fontSize: "0.6rem", margin: "0 0 0.15rem" }}>{m.mangaName}</h1>
            <p style={{ color: "#999", fontSize: "0.32rem" }}>{m.mangaBlurb}</p>
            <p style={{ color: "#999", fontSize: "0.32rem" }}>
              作者：{m.mangaAuthor || "未知"} · 状态：{m.mangaSerial || "连载中"} · 共 {m.mangaTotal || chapters.length} 话
            </p>
          </div>
        </div>
        {chapters.length ? (
          <ul className="content_playlist clearfix" style={{ marginTop: "0.4rem" }}>
            {chapters.map((c, i) => (
              <li key={i}>
                <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="show_no">暂无章节</div>
        )}
      </div>
    </div>
  );
}