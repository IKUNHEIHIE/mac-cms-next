import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import BuyButton from "@/components/member/BuyButton";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "积分购买" };

export default async function BuyPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const [vods, owned] = await Promise.all([
    prisma.vod.findMany({ where: { vodPoints: { gt: 0 } }, orderBy: { vodTime: "desc" }, take: 40 }),
    prisma.ulog.findMany({ where: { userId: user.userId, ulogType: 5 }, select: { ulogRid: true } }),
  ]);
  const ownedSet = new Set(owned.map((o) => o.ulogRid));
  return (
    <MemberPage title="积分购买">
      <p style={{ color: "#999" }}>当前积分：{user.userPoints}。购买后可永久观看对应影片。</p>
      {vods.length === 0 ? <div className="mc_empty">暂无可购买的影片</div> : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {vods.map((v) => (
          <li key={v.vodId} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px dashed #f0f0f0" }}>
            <span style={{ width: 96, height: 56, flex: "none", borderRadius: 4, backgroundImage: `url(${poster(v.vodPic)})`, backgroundSize: "cover" }} />
            <div style={{ flex: 1 }}>
              <Link href={`/vod/detail/${v.vodId}`} style={{ fontSize: 15, color: "#333" }}>{v.vodName}</Link>
              <p style={{ margin: "4px 0 0", color: "#999", fontSize: 12 }}>需要 {v.vodPoints} 积分</p>
            </div>
            {ownedSet.has(v.vodId) ? (
              <span style={{ color: "#3a3", fontSize: 13 }}>已购买</span>
            ) : (
              <BuyButton vodId={v.vodId} />
            )}
          </li>
        ))}
      </ul>
    </MemberPage>
  );
}