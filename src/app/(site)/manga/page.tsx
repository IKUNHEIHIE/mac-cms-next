import Link from "next/link";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "漫画" };

export default async function MangaPage() {
  const list = await prisma.manga.findMany({ where: { mangaStatus: 1 }, orderBy: { mangaTime: "desc" }, take: 40 });
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <h2 className="title">漫画</h2>
        </div>
        <ul className="vodlist vodlist_wi clearfix">
          {list.map((m) => (
            <li key={m.mangaId} className="vodlist_item">
              <Link
                className="vodlist_thumb"
                href={`/manga/${m.mangaId}`}
                style={{ backgroundImage: `url(${poster(m.mangaPic)})` }}
              >
                <span className="pic_text text_right">{m.mangaRemarks || `${m.mangaTotal}话`}</span>
              </Link>
              <div className="vodlist_titbox">
                <p className="vodlist_title"><Link href={`/manga/${m.mangaId}`}>{m.mangaName}</Link></p>
                <p className="vodlist_sub">{m.mangaAuthor || "未知作者"}</p>
              </div>
            </li>
          ))}
        </ul>
        {list.length === 0 ? <div className="show_no">暂无漫画</div> : null}
      </div>
    </div>
  );
}