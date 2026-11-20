import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "邀请奖励" };

export default async function RewardPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const invited = await prisma.user.findMany({ where: { userPid: user.userId }, orderBy: { userRegTime: "desc" } });
  return (
    <MemberPage title="邀请奖励">
      <h2>邀请好友</h2>
      <p style={{ color: "#999" }}>好友通过您的链接注册，您可获得 50 积分奖励，好友获得 20 积分。</p>
      <div style={{ background: "#fafafa", padding: 14, borderRadius: 6, fontSize: 14, wordBreak: "break-all" }}>
        您的专属注册链接：<br />
        <code>{`http://localhost:3000/user/reg?pid=${user.userId}`}</code>
      </div>
      <h2 style={{ marginTop: 24 }}>已邀请 {invited.length} 人</h2>
      <table className="mc_table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>注册时间</th>
          </tr>
        </thead>
        <tbody>
          {invited.map((u) => (
            <tr key={u.userId}>
              <td>{u.userName}</td>
              <td>{fmtTime(u.userRegTime, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MemberPage>
  );
}