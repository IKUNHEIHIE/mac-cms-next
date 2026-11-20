import Link from "next/link";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "演员" };

export default async function ActorIndexPage() {
  const actors = await prisma.actor.findMany({ where: { actorStatus: 1 }, orderBy: { actorHits: "desc" }, take: 120 });
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <h2 className="title">演员</h2>
        </div>
        <ul className="actorlist clearfix" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "0.3rem" }}>
          {actors.map((a) => (
            <li key={a.actorId} style={{ textAlign: "center" }}>
              <Link href={`/actor/${a.actorId}`}>
                <span
                  style={{
                    display: "block",
                    paddingTop: "130%",
                    borderRadius: "6px",
                    backgroundImage: `url(${poster(a.actorPic)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <span style={{ display: "block", marginTop: "0.15rem", fontSize: "0.32rem" }}>{a.actorName}</span>
              </Link>
            </li>
          ))}
        </ul>
        {actors.length === 0 ? <div className="show_no">暂无演员</div> : null}
      </div>
    </div>
  );
}