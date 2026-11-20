import Link from "next/link";
import ApiForm from "@/components/member/ApiForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "找回密码" };

export default function FindpassPage() {
  return (
    <div className="mc_reg_wrap">
      <h1>找回密码</h1>
      <ApiForm
        action="/api/user/findpass"
        redirect="/user/login"
        submitText="重置密码"
        fields={[
          { name: "user_name", label: "账号", placeholder: "请输入账号", required: true },
          { name: "user_answer", label: "密保答案", placeholder: "注册时设置的密保答案", required: true },
          { name: "user_pwd", label: "新密码", type: "password", placeholder: "至少 6 位", required: true },
        ]}
      />
      <div className="mc_reg_links">
        <Link href="/user/login">返回登录</Link>
        <Link href="/">返回首页</Link>
      </div>
    </div>
  );
}