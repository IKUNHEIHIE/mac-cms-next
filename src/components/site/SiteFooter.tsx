import Link from "next/link";
import QRCode from "qrcode";
import Icon from "./Icon";
import type { SiteConfig } from "@/lib/settings";

export default async function SiteFooter({ site }: { site: SiteConfig }) {
  const qr = await QRCode.toDataURL(site.site_url || "http://localhost:3000", { width: 140, margin: 1 }).catch(() => "");
  return (
    <div className="foot clearfix">
      <div className="container">
        <ul className="extra clearfix">
          <li id="backtop-ico">
            <a className="backtop" href="#top" title="返回顶部">
              <span className="top_ico">
                <Icon code={0xe628} />
              </span>
            </a>
          </li>
          <li>
            <Link href="/rss" title="RSS订阅">
              <span className="m_ico">
                <Icon code={0xe653} />
              </span>
            </Link>
          </li>
        </ul>
        <div className="fo_t">
          {site.site_description}
          <p>
            &copy;&nbsp;{new Date().getFullYear()}&nbsp;{site.site_url}&nbsp;&nbsp;E-Mail：
            {site.site_email}
          </p>
        </div>
        <div className="mc_qr">
          {qr ? <img src={qr} alt="扫码访问" width={100} height={100} /> : null}
          <span>扫码用手机访问</span>
        </div>
        <div className="map_nav">
          <Link href="/rss" target="_blank">
            RSS订阅
          </Link>
          <span className="split_line" />
          <Link href="/map">最新更新</Link>
          <span className="split_line" />
          <Link href="/label/rank">排行榜</Link>
          <span className="split_line" />
          <Link href="/gbook">留言反馈</Link>
          <span className="split_line" />
          <Link href="/admin" className="hidden_xs">
            管理后台
          </Link>
        </div>
      </div>
    </div>
  );
}