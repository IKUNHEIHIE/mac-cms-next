import { safeHtml } from "@/lib/sanitize";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import VodCard from "@/components/site/VodCard";
import { getSiteContext } from "@/lib/site";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await prisma.actor.findUnique({ where: { actorId: Number(id) } });
  return { title: actor?.actorName || "演员" };
}

export default async function ActorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await prisma.actor.findUnique({ where: { actorId: Number(id) } });
  if (!actor) notFound();
  const { settings } = await getSiteContext();
  const works = await prisma.vod.findMany({
    where: { vodActor: { contains: actor.actorName } },
    orderBy: { vodTime: "desc" },
    take: 24,
  });
  const roles = await prisma.role.findMany({ where: { roleRid: actor.actorId }, take: 20 });

  return (
    <div className="container">
      <div className="pannel clearfix" style={{ paddingTop: "0.6rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div
            style={{
              width: "4.2rem",
              height: "5.4rem",
              flex: "none",
              borderRadius: "8px",
              backgroundImage: `url(${poster(actor.actorPic)})`,
              backgroundSize: "cover",
              backgroundPosition: "top center",
            }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "0.7rem", margin: "0 0 0.2rem" }}>{actor.actorName}</h1>
            <p style={{ color: "#999", fontSize: "0.33rem" }}>{actor.actorBlurb || "暂无简介"}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0.2rem 0", fontSize: "0.32rem", color: "#666", columns: 2 }}>
              <li>性别：{actor.actorSex || "未知"}</li>
              <li>地区：{actor.actorArea || "未知"}</li>
              <li>生日：{actor.actorBirthday || "未知"}</li>
              <li>星座：{actor.actorStarsign || "未知"}</li>
              <li>身高：{actor.actorHeight || "未知"}</li>
              <li>人气：{actor.actorHits}</li>
            </ul>
            {actor.actorContent ? (
              <div style={{ color: "#555", lineHeight: 1.9, fontSize: "0.33rem" }} dangerouslySetInnerHTML={{ __html: safeHtml(actor.actorContent) }} />
            ) : null}
          </div>
        </div>
      </div>
      {roles.length ? (
        <div className="pannel clearfix">
          <div className="pannel_head clearfix">
            <h3 className="title">饰演角色</h3>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {roles.map((r) => (
              <span key={r.roleId} className="mc_user_card" style={{ padding: "0.2rem 0.4rem" }}>
                {r.roleName}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <span className="pull_right">{works.length} 部作品</span>
          <h3 className="title">参演作品</h3>
        </div>
        <ul className="vodlist vodlist_wi clearfix">
          {works.map((v, i) => (
            <VodCard key={v.vodId} vod={v} playlink={settings.theme.playlink} num={i + 1} />
          ))}
        </ul>
        {works.length === 0 ? <div className="show_no">暂无作品</div> : null}
      </div>
    </div>
  );
}