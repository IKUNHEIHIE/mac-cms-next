import Link from "next/link";
import Icon from "@/components/site/Icon";

const NAV = [
  { href: "/user", label: "个人中心", code: 0xe62b },
  { href: "/user/info", label: "基本资料", code: 0xe631 },
  { href: "/user/favs", label: "我的收藏", code: 0xe629 },
  { href: "/user/plays", label: "观看历史", code: 0xe624 },
  { href: "/user/downs", label: "我的下载", code: 0xe63c },
  { href: "/user/popedom", label: "我的权限", code: 0xe665 },
];

export default function MemberNav() {
  return (
    <ul className="user_list_box" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {NAV.map((n) => (
        <li key={n.href} style={{ padding: "0.15rem 0" }}>
          <Link href={n.href} className="text_muted" style={{ fontSize: "0.34rem" }}>
            <Icon code={n.code} />
            &nbsp;{n.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}