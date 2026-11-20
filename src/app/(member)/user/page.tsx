import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "个人中心" };

export default async function UserIndexPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  const [group, favs, plays, orders, invites] = await Promise.all([
    prisma.group.findFirst({ where: { groupId: Number((user.groupId || "2").split(",")[0]) || 2 } }),
    prisma.ulog.count({ where: { userId: user.userId, ulogType: 1 } }),
    prisma.ulog.count({ where: { userId: user.userId, ulogType: 4 } }),
    prisma.order.count({ where: { userId: user.userId } }),
    prisma.user.count({ where: { userPid: user.userId } }),
  ]);
  return (
    <MemberPage
      title="个人中心"
      action={
        <Link href="/user/info" className="btn-right">
          修改
        </Link>
      }
    >
      <h2>我的资料</h2>
      <div className="mc_stat_grid">
        <div className="mc_stat_card">
          <b>{user.userPoints}</b>
          <span>账户积分</span>
        </div>
        <div className="mc_stat_card">
          <b>{favs}</b>
          <span>我的收藏</span>
        </div>
        <div className="mc_stat_card">
          <b>{plays}</b>
          <span>观看记录</span>
        </div>
        <div className="mc_stat_card">
          <b>{orders}</b>
          <span>充值订单</span>
        </div>
      </div>
      <p><span className="xiang">用户名：</span>{user.userName}</p>
      <p><span className="xiang">会员组：</span>{group?.groupName || "默认会员"}</p>
      <p>
        <span className="xiang">会员期限：</span>
        {Number(user.groupId) < 3 ? "永久有效" : user.userEndTime ? fmtTime(user.userEndTime) : "未开通"}
      </p>
      <p><span className="xiang">QQ：</span>{user.userQq || "未填写"}</p>
      <p><span className="xiang">Email：</span>{user.userEmail || "未填写"}</p>
      <p><span className="xiang">注册时间：</span>{fmtTime(user.userRegTime, true)}</p>
      <p><span className="xiang">上次登录：</span>{fmtTime(user.userLastLoginTime, true)}</p>
      <p><span className="xiang">登录次数：</span>{user.userLoginNum}</p>
      <p><span className="xiang">邀请人数：</span>{invites} 人</p>
    </MemberPage>
  );
}