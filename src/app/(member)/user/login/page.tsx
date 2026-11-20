import Link from "next/link";
import ApiForm from "@/components/member/ApiForm";
import { getExtra } from "@/lib/extraSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "会员登录" };

export default async function LoginPage() {
  const extra = await getExtra();
  return (
    <div className="mc_reg_wrap">
      <h1>会员登录</h1>
      <ApiForm
        action="/api/user/login"
        captcha={Boolean(extra.captcha.enabled)}
        redirect="/user"
        submitText="立即登录"
        fields={[
          { name: "user_name", label: "账号", placeholder: "请输入登录账号", required: true },
          { name: "user_pwd", label: "密码", type: "password", placeholder: "请输入登录密码", required: true },
        ]}
      />
      <div className="mc_reg_links">
        <Link href="/">返回首页</Link>
        <Link href="/user/reg">注册账号</Link>
        <Link href="/user/findpass">忘记密码</Link>
      </div>
      <div className="mc_reg_links" style={{ marginTop: 8 }}>
        演示账号：demo / demo123
      </div>
    </div>
  );
}