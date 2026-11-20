import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { parsePlaySources, poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vod = await prisma.vod.findUnique({ where: { vodId: Number(id) } });
  return { title: vod ? `下载 ${vod.vodName}` : "下载" };
}

export default async function VodDownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vod = await prisma.vod.findUnique({ where: { vodId: Number(id) } });
  if (!vod) notFound();
  const sources = parsePlaySources({ vodPlayFrom: vod.vodDownFrom, vodPlayUrl: vod.vodDownUrl });

  return (
    <div className="container">
      <div className="hot_banner" style={{ minHeight: "2.8rem" }}>
        <div className="bgi_box">
          <span className="bgi" style={{ backgroundImage: `url(${poster(vod.vodPicSlide || vod.vodPic)})` }} />
          <span className="bgfd" />
        </div>
        <div className="container" style={{ padding: "0.5rem 0", position: "relative", zIndex: 2, color: "#fff" }}>
          <h1 style={{ fontSize: "0.55rem", margin: 0 }}>{vod.vodName} 下载</h1>
          <p style={{ margin: "0.1rem 0 0", opacity: 0.8 }}>{vod.vodRemarks}</p>
        </div>
      </div>
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <Link className="text_muted pull_right" href={`/vod/detail/${vod.vodId}`}>返回详情</Link>
          <h3 className="title">下载地址</h3>
        </div>
        {sources.length === 0 ? <div className="show_no">暂无下载地址</div> : null}
        {sources.map((s) => (
          <div key={s.sid} style={{ padding: "0.2rem 0" }}>
            <div className="player_infotip">{s.show}</div>
            <ul className="content_playlist clearfix">
              {s.urls.map((u) => (
                <li key={u.nid}>
                  <a href={u.url} target="_blank" rel="noreferrer">{u.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}