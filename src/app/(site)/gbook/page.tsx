import { prisma } from "@/lib/db";
import GbookForm from "@/components/site/GbookForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "留言板" };

export default async function GbookPage({ searchParams }: { searchParams: Promise<{ report?: string }> }) {
  const sp = await searchParams;
  const list = await prisma.gbook.findMany({ where: { gbookStatus: 1 }, orderBy: { gbookTime: "desc" }, take: 50 });
  const defaultContent = sp.report ? `报错反馈：影片 ID ${sp.report} 无法播放，请检查修复。` : "";
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <h2 className="title">留言板</h2>
        </div>
        <GbookForm defaultContent={defaultContent} />
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {list.map((g) => (
            <li key={g.gbookId} style={{ padding: "0.3rem 0", borderBottom: "1px dashed #f0f0f0" }}>
              <p style={{ margin: 0, color: "#333", fontSize: "0.34rem" }}>
                <strong>{g.gbookName || "游客"}</strong>
                <em style={{ color: "#bbb", fontStyle: "normal", marginLeft: "0.3rem", fontSize: "0.28rem" }}>
                  {new Date(g.gbookTime * 1000).toLocaleString("zh-CN")}
                </em>
              </p>
              <p style={{ margin: "0.12rem 0", color: "#555", fontSize: "0.34rem", lineHeight: 1.7 }}>{g.gbookContent}</p>
              {g.gbookReply ? (
                <p style={{ margin: "0.1rem 0", background: "#fafafa", padding: "0.2rem", borderRadius: 4, fontSize: "0.32rem", color: "#666" }}>
                  <strong>站长回复：</strong>
                  {g.gbookReply}
                </p>
              ) : null}
            </li>
          ))}
          {list.length === 0 ? <li className="mc_comment_empty">暂无留言</li> : null}
        </ul>
      </div>
    </div>
  );
}