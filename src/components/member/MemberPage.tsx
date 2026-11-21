import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/user";
import MemberNav from "./MemberNav";
import LogoutButton from "./LogoutButton";
import Icon from "@/components/site/Icon";

export default async function MemberPage({
  title,
  action,
  children,
  wide = false,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const user = await currentUser();
  if (!user) redirect("/user/login");
  return (
    <div id="member" className="fn-clear">
      <div id="left" className="dl-bl">
        <div id="ui-nav" className="m-nav">
          <Link href="/" className="btn-left">
            <Icon code={0xe625} />
          </Link>
          <Link href="/" className="btn-right">
            <Icon code={0xe634} />
          </Link>
          <span className="mb-title">个人中心</span>
        </div>
        <div style={{ padding: "0.3rem 0.3rem 0", color: "#999", fontSize: "0.3rem" }}>
          {user.userNickName || user.userName}
        </div>
        <MemberNav />
        <div style={{ padding: "0.3rem" }}>
          <LogoutButton />
        </div>
      </div>
      <div id="right" className="dr-no">
        <div className="m-nav">
          <Link href="/" className="btn-left">
            <Icon code={0xe625} />
          </Link>
          {action}
          <span className="mb-title">{title}</span>
        </div>
        <div className="co-right co-right-bg" style={wide ? {} : {}}>
          {children}
        </div>
      </div>
    </div>
  );
}