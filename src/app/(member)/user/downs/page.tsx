import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import { poster, vodPlayLink } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "我的下载" };

export default async function DownsPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const logs = await prisma.ulog.findMany({ where: { userId: user.userId, ulogType: 3 }, orderBy: { ulogTime: "desc" }, take: 100 });
  const vods = logs.length ? await prisma.vod.findMany({ where: { vodId: { in: logs.map((l) => l.ulogRid) } } }) : [];
  return (
    <MemberPage title="我的下载">
      {logs.length === 0 ? <div className="mc_empty">暂无下载记录</div> : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {logs.map((l) => {
          const v = vods.find((x) => x.vodId === l.ulogRid);
          if (!v) return null;
          return (
            <li key={l.ulogId} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px dashed #f0f0f0" }}>
              <span style={{ width: 96, height: 56, flex: "none", borderRadius: 4, backgroundImage: `url(${poster(v.vodPic)})`, backgroundSize: "cover" }} />
              <div style={{ flex: 1 }}>
                <Link href={`/vod/down/${v.vodId}`} style={{ fontSize: 15, color: "#333" }}>{v.vodName}</Link>
              </div>
              <Link href={`/vod/down/${v.vodId}`} className="mc_btn" style={{ height: 28, lineHeight: "28px", fontSize: 12, padding: "0 12px" }}>
                下载页
              </Link>
              <Link href={vodPlayLink(v)} className="mc_btn plain" style={{ height: 28, lineHeight: "28px", fontSize: 12, padding: "0 12px" }}>
                播放
              </Link>
            </li>
          );
        })}
      </ul>
    </MemberPage>
  );
}