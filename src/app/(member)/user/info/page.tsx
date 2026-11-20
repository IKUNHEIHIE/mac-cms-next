import { redirect } from "next/navigation";
import { currentUser } from "@/lib/user";
import MemberPage from "@/components/member/MemberPage";
import ApiForm from "@/components/member/ApiForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "基本资料" };

export default async function UserInfoPage() {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  return (
    <MemberPage title="基本资料">
      <h2>修改信息</h2>
      <ApiForm
        action="/api/user/update"
        refresh
        submitText="保存资料"
        fields={[
          { name: "user_nick_name", label: "昵称", defaultValue: user.userNickName },
          { name: "user_email", label: "Email", type: "email", defaultValue: user.userEmail },
          { name: "user_qq", label: "QQ号码", defaultValue: user.userQq },
          { name: "user_phone", label: "手机号", defaultValue: user.userPhone },
          { name: "user_portrait", label: "头像地址", defaultValue: user.userPortrait },
          { name: "user_question", label: "密保问题", defaultValue: user.userQuestion },
          { name: "user_answer", label: "密保答案", defaultValue: user.userAnswer },
        ]}
      />
      <h2 style={{ marginTop: 26 }}>修改密码</h2>
      <ApiForm
        action="/api/user/update"
        refresh
        submitText="修改密码"
        fields={[
          { name: "old_pwd", label: "原密码", type: "password" },
          { name: "user_pwd", label: "新密码", type: "password" },
        ]}
      />
    </MemberPage>
  );
}