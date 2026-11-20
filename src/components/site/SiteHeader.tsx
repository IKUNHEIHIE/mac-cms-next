"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import type { SiteConfig, ThemeConfig } from "@/lib/settings";

type NavType = { typeId: number; typeName: string };

export default function SiteHeader({
  site,
  theme,
  types,
  title,
  wd,
}: {
  site: SiteConfig;
  theme: ThemeConfig;
  types: NavType[];
  title?: string;
  wd?: string;
}) {
  const pathname = usePathname();
  const hot = (site.search_hot || "").split(/[,，]/).filter(Boolean).slice(0, 5);

  return (
    <div id="topnav" className="head_box">
      <div className="header">
        <div className="head_a">
          <div className="head_logo">
            <Link
              aria-label={site.site_name}
              className="logo logo_b"
              href="/"
              style={{ backgroundImage: `url(${theme.logoB})` }}
            />
            <Link
              aria-label={site.site_name}
              className="logo logo_w"
              href="/"
              style={{ backgroundImage: `url(${theme.logoW})` }}
            />
          </div>
          <div className="head_menu_a hidden_xs hidden_mi">
            <ul className="top_nav clearfix">
              <li className={pathname === "/" ? "active" : undefined}>
                <Link href="/">首页</Link>
              </li>
              {types.map((t) => (
                <li
                  key={t.typeId}
                  className={pathname === `/vod/type/${t.typeId}` ? "active" : undefined}
                >
                  <Link href={`/vod/type/${t.typeId}`}>{t.typeName}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="head_user">
            <ul>
              <li className="top_ico">
                <Link href="/map" title="最新">
                  <Icon code={0xe652} />
                </Link>
              </li>
              <li className="top_ico">
                <Link href="/label/rank" title="排行榜">
                  <Icon code={0xe618} />
                </Link>
              </li>
              <li className="top_ico">
                <Link href="/topic" title="专题">
                  <Icon code={0xe64c} />
                </Link>
              </li>
              <li className="top_ico">
                <Link href="/gbook" title="留言">
                  <Icon code={0xe632} />
                </Link>
              </li>
              <li className="top_ico">
                <Link href="/user" title="会员中心" className="mac_user">
                  <Icon code={0xe62b} />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="header">
        <div className="head_b">
          <button className="bk_btn fl" onClick={() => history.back()} title="返回" type="button">
            <Icon code={0xe625} />
          </button>
          <span className="hd_tit fl">{title}</span>
          <div className="head_menu_b">
            <Link className="menu" href="/map" title="全部分类">
              <Icon code={0xe640} className="menu_ico" />
              <span className="hidden_xs">&nbsp;全部分类</span>
            </Link>
            <ul className="all_menu" style={{ display: "none" }}>
              {types.map((t) => (
                <li key={t.typeId}>
                  <Link href={`/vod/type/${t.typeId}`}>{t.typeName}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="head_search">
            <form id="search" name="search" method="get" action="/vod/search">
              <Icon code={0xe633} />
              <input
                id="txt"
                type="text"
                name="wd"
                className="mac_wd form_control"
                defaultValue={wd || ""}
                placeholder="输入搜索关键字"
              />
              <button className="submit" id="searchbutton" type="submit">
                搜索
              </button>
            </form>
          </div>
          <div className="head_hot_search hidden_xs">
            <ul className="pops_list">
              <li>
                <span className="hot_search_tit">
                  <Icon code={0xe631} />
                  &nbsp;热门搜索
                </span>
              </li>
              {hot.map((w) => (
                <li key={w}>
                  <Link href={`/vod/search?wd=${encodeURIComponent(w)}`}>
                    <span className="hot_name">{w}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}