import "../(site)/site.css";
import Link from "next/link";
import { isRequestBlocked } from "@/lib/extraSettings";
import ThemeRem from "@/components/site/ThemeRem";

export const dynamic = "force-dynamic";

export const metadata = { title: "会员中心" };

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  if (await isRequestBlocked()) {
    return <div style={{ padding: "120px 20px", textAlign: "center", fontSize: 16, color: "#666" }}>您的访问已被限制，如有疑问请联系站点管理员。</div>;
  }
  return (
    <>
      <ThemeRem />
      <link rel="stylesheet" href="/theme/conch/asset/css/member/member.conch.css" />
      <link rel="stylesheet" href="/theme/conch/member.css" />
      <div className="mc_member_head">
        <div className="mc_member_head_inner">
          <Link href="/" className="mc_member_logo">
            影视
          </Link>
          <nav>
            <Link href="/">首页</Link>
            <Link href="/user">会员中心</Link>
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}