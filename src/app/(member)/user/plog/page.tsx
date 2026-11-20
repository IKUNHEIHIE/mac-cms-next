import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "积分明细" };

export default async function PlogPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const list = await prisma.plog.findMany({ where: { userId: user.userId }, orderBy: { plogTime: "desc" }, take: 100 });
  return (
    <MemberPage title="积分明细">
      <table className="mc_table">
        <thead>
          <tr>
            <th>时间</th>
            <th>变动</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.plogId}>
              <td>{fmtTime(p.plogTime, true)}</td>
              <td style={{ color: p.plogPoints >= 0 ? "#3a3" : "#ff5f00" }}>{p.plogPoints >= 0 ? "+" : ""}{p.plogPoints}</td>
              <td>{p.plogRemarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 ? <p style={{ color: "#999" }}>暂无积分记录</p> : null}
    </MemberPage>
  );
}