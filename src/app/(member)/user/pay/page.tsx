import { redirect } from "next/navigation";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import ApiForm from "@/components/member/ApiForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "在线充值" };

export default async function PayPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  return (
    <MemberPage title="在线充值">
      <h2>积分充值</h2>
      <p style={{ color: "#999" }}>当前积分：{user.userPoints}。演示环境直接到账，生产环境可接入支付宝/微信。</p>
      <ApiForm
        action="/api/user/pay"
        refresh
        submitText="立即充值"
        fields={[
          {
            name: "package",
            label: "充值套餐",
            options: [
              { value: "p300", label: "300 积分 / ￥30" },
              { value: "p1000", label: "1000 积分 / ￥88" },
              { value: "p3000", label: "3000 积分 / ￥228" },
              { value: "p10000", label: "10000 积分 / ￥688" },
            ],
          },
          {
            name: "pay_type",
            label: "支付方式",
            options: [
              { value: "demo", label: "演示支付" },
              { value: "alipay", label: "支付宝" },
              { value: "wechat", label: "微信支付" },
            ],
          },
        ]}
      />
    </MemberPage>
  );
}