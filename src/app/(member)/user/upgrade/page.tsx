import { redirect } from "next/navigation";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import ApiForm from "@/components/member/ApiForm";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "升级 VIP" };

export default async function UpgradePage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  return (
    <MemberPage title="升级 VIP">
      <h2>会员升级</h2>
      <p style={{ color: "#999" }}>
        当前积分 {user.userPoints}，VIP 到期时间：{user.userEndTime ? fmtTime(user.userEndTime) : "未开通"}。
      </p>
      <ApiForm
        action="/api/user/upgrade"
        refresh
        submitText="立即升级"
        fields={[
          {
            name: "months",
            label: "升级时长",
            options: [
              { value: "1", label: "1 个月 / 300 积分" },
              { value: "12", label: "12 个月 / 3000 积分" },
            ],
          },
        ]}
      />
      <h2 style={{ marginTop: 24 }}>VIP 特权</h2>
      <ul style={{ color: "#666", lineHeight: 2 }}>
        <li>观看 VIP 专属影片</li>
        <li>每日签到积分翻倍</li>
        <li>更高下载与播放权限</li>
      </ul>
    </MemberPage>
  );
}