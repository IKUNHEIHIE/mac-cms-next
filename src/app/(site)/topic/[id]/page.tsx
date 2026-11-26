import { safeHtml } from "@/lib/sanitize";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import VodCard from "@/components/site/VodCard";
import { getSiteContext } from "@/lib/site";
import { poster } from "@/lib/maccms";
import { vodCardSelect } from "@/lib/vodQuery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await prisma.topic.findUnique({ where: { topicId: Number(id) } });
  return { title: topic?.topicName || "专题" };
}

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topicId = Number(id);
  const topic = await prisma.topic.findUnique({ where: { topicId } });
  if (!topic) notFound();
  const { settings } = await getSiteContext();
  const ids = (topic.topicRelVod || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const vods = ids.length
    ? await prisma.vod.findMany({
        where: { vodId: { in: ids }, vodStatus: 1 },
        select: vodCardSelect(settings.theme.playlink),
      })
    : [];
  const ordered = ids.map((vid) => vods.find((v) => v.vodId === vid)).filter(Boolean) as typeof vods;

  return (
    <>
      <div className="hot_banner" style={{ minHeight: "3.2rem" }}>
        <div className="bgi_box">
          <span className="bgi" style={{ backgroundImage: `url(${poster(topic.topicPicSlide || topic.topicPic)})` }} />
          <span className="bgfd" />
        </div>
        <div className="container" style={{ padding: "0.6rem 0", position: "relative", zIndex: 2, color: "#fff" }}>
          <h1 style={{ fontSize: "0.65rem", margin: "0 0 0.2rem" }}>{topic.topicName}</h1>
          <p style={{ margin: 0, opacity: 0.85 }}>{topic.topicBlurb || topic.topicRemarks}</p>
        </div>
      </div>
      <div className="container">
        <div className="pannel clearfix">
          <div className="pannel_head clearfix">
            <span className="pull_right">{ordered.length} 部影片</span>
            <h3 className="title">专题片单</h3>
          </div>
          <ul className="vodlist vodlist_wi clearfix">
            {ordered.map((v, i) => (
              <VodCard key={v.vodId} vod={v} playlink={settings.theme.playlink} num={i + 1} />
            ))}
          </ul>
          {ordered.length === 0 ? <div className="show_no">暂无影片</div> : null}
          {topic.topicContent ? (
            <div style={{ padding: "0.3rem 0", color: "#666", lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: safeHtml(topic.topicContent) }} />
          ) : null}
        </div>
      </div>
    </>
  );
}