import Link from "next/link";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "影视专题" };

export default async function TopicIndexPage() {
  const topics = await prisma.topic.findMany({ where: { topicStatus: 1 }, orderBy: { topicSort: "asc" } });
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <h2 className="title">影视专题</h2>
        </div>
        <ul className="topiclist clearfix" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {topics.map((t) => (
            <li key={t.topicId} className="topiclist_item" style={{ padding: "0.25rem 0", borderBottom: "1px dashed #f0f0f0" }}>
              <Link href={`/topic/${t.topicId}`} style={{ display: "flex", gap: "0.3rem" }}>
                <span
                  style={{
                    width: "4rem",
                    height: "2.2rem",
                    flex: "none",
                    borderRadius: "6px",
                    backgroundImage: `url(${poster(t.topicPicSlide || t.topicPic)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <span>
                  <p style={{ margin: "0 0 0.15rem", fontSize: "0.42rem", color: "#333" }}>{t.topicName}</p>
                  <p style={{ margin: 0, color: "#999", fontSize: "0.32rem" }}>{t.topicBlurb || t.topicRemarks}</p>
                  <p style={{ margin: "0.15rem 0 0", color: "#bbb", fontSize: "0.28rem" }}>{t.topicHits} 次浏览</p>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {topics.length === 0 ? <div className="show_no">暂无专题</div> : null}
      </div>
    </div>
  );
}