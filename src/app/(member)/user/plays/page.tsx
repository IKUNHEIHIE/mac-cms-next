import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import UlogRemove from "@/components/member/UlogRemove";
import { fmtTime, poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "观看历史" };

export default async function PlaysPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const logs = await prisma.ulog.findMany({ where: { userId: user.userId, ulogType: 4 }, orderBy: { ulogTime: "desc" }, take: 100 });
  const vods = logs.length
    ? await prisma.vod.findMany({ where: { vodId: { in: logs.map((l) => l.ulogRid) } } })
    : [];
  return (
    <MemberPage title="观看历史">
      {logs.length === 0 ? <div className="mc_empty">暂无观看记录</div> : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {logs.map((l) => {
          const v = vods.find((x) => x.vodId === l.ulogRid);
          if (!v) return null;
          return (
            <li key={l.ulogId} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px dashed #f0f0f0" }}>
              <Link
                href={`/vod/play/${v.vodId}/${l.ulogSid || 1}/${l.ulogNid || 1}`}
                style={{
                  width: 96,
                  height: 56,
                  flex: "none",
                  borderRadius: 4,
                  backgroundImage: `url(${poster(v.vodPic)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div style={{ flex: 1 }}>
                <Link href={`/vod/detail/${v.vodId}`} style={{ fontSize: 15, color: "#333" }}>{v.vodName}</Link>
                <p style={{ margin: "4px 0 0", color: "#999", fontSize: 12 }}>
                  看到第 {l.ulogNid || 1} 集 · {fmtTime(l.ulogTime, true)}
                </p>
              </div>
              <Link href={`/vod/play/${v.vodId}/${l.ulogSid || 1}/${l.ulogNid || 1}`} className="mc_btn" style={{ height: 28, lineHeight: "28px", fontSize: 12, padding: "0 12px" }}>
                继续观看
              </Link>
              <UlogRemove rid={v.vodId} type={4} label="删除记录" />
            </li>
          );
        })}
      </ul>
    </MemberPage>
  );
}