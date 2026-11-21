import Link from "next/link";
import ApiForm from "@/components/member/ApiForm";
import { getExtra } from "@/lib/extraSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "注册会员" };

export default async function RegPage() {
  const extra = await getExtra();
  return (
    <div className="mc_reg_wrap">
      <h1>注册会员</h1>
      <ApiForm
        action="/api/user/register"
        captcha={Boolean(extra.captcha.enabled)}
        redirect="/user"
        submitText="立即注册"
        fields={[
          { name: "user_name", label: "账号", placeholder: "3-30 位字母、数字或中文", required: true },
          { name: "user_pwd", label: "密码", type: "password", placeholder: "至少 6 位", required: true },
          { name: "user_pwd2", label: "确认密码", type: "password", placeholder: "再次输入密码", required: true },
          { name: "user_email", label: "邮箱", type: "email", placeholder: "选填" },
          { name: "user_question", label: "密保问题", placeholder: "选填，用于找回密码" },
          { name: "user_answer", label: "密保答案", placeholder: "选填" },
        ]}
      />
      <div className="mc_reg_links">
        <Link href="/">返回首页</Link>
        <Link href="/user/login">已有账号，去登录</Link>
      </div>
    </div>
  );
}