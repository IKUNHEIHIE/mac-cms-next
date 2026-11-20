import { redirect } from "next/navigation";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import ApiForm from "@/components/member/ApiForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "充值卡" };

export default async function CardsPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  return (
    <MemberPage title="充值卡">
      <h2>使用充值卡</h2>
      <p style={{ color: "#999" }}>演示卡号：MAC888888 / 密码：888888</p>
      <ApiForm
        action="/api/user/card"
        refresh
        submitText="立即充值"
        fields={[
          { name: "card_no", label: "卡号", required: true },
          { name: "card_pwd", label: "卡密", required: true },
        ]}
      />
    </MemberPage>
  );
}