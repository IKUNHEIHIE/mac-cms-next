import Link from "next/link";
import Icon from "@/components/site/Icon";

const NAV = [
  { href: "/user", label: "个人中心", code: 0xe62b },
  { href: "/user/info", label: "基本资料", code: 0xe631 },
  { href: "/user/favs", label: "我的收藏", code: 0xe629 },
  { href: "/user/plays", label: "观看历史", code: 0xe624 },
  { href: "/user/downs", label: "我的下载", code: 0xe63c },
  { href: "/user/buy", label: "积分购买", code: 0xe62a },
  { href: "/user/orders", label: "我的订单", code: 0xe62a },
  { href: "/user/pay", label: "在线充值", code: 0xe653 },
  { href: "/user/cards", label: "充值卡", code: 0xe618 },
  { href: "/user/cash", label: "积分提现", code: 0xe652 },
  { href: "/user/reward", label: "邀请奖励", code: 0xe62b },
  { href: "/user/upgrade", label: "升级 VIP", code: 0xe638 },
  { href: "/user/plog", label: "积分明细", code: 0xe630 },
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