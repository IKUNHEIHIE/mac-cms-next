import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await prisma.role.findUnique({ where: { roleId: Number(id) } });
  return { title: role?.roleName || "角色" };
}

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await prisma.role.findUnique({ where: { roleId: Number(id) } });
  if (!role) notFound();
  const actor = role.roleRid ? await prisma.actor.findUnique({ where: { actorId: role.roleRid } }) : null;
  return (
    <div className="container">
      <div className="pannel clearfix" style={{ paddingTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div
            style={{
              width: "4rem",
              height: "5rem",
              flex: "none",
              borderRadius: 8,
              backgroundImage: `url(${poster(role.rolePic || actor?.actorPic)})`,
              backgroundSize: "cover",
              backgroundPosition: "top center",
            }}
          />
          <div>
            <h1 style={{ fontSize: "0.65rem", margin: "0 0 0.2rem" }}>{role.roleName}</h1>
            <p style={{ color: "#999", fontSize: "0.33rem" }}>
              饰演：{actor ? <Link href={`/actor/${actor.actorId}`}>{actor.actorName}</Link> : role.roleActor || "未知"}
            </p>
            <p style={{ color: "#999", fontSize: "0.33rem" }}>人气：{role.roleHits}</p>
            {role.roleContent ? (
              <div style={{ color: "#555", lineHeight: 1.9, fontSize: "0.33rem" }} dangerouslySetInnerHTML={{ __html: role.roleContent }} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}