import Link from "next/link";

export type BannerItem = {
  id: number;
  name: string;
  pic: string;
  sub: string;
  link: string;
  tag: string;
};

export default function Banner({ items }: { items: BannerItem[] }) {
  if (!items.length) return null;
  const active = items[0];
  return (
    <div id="banstem" className="hot_banner">
      <div className="bgi_box">
        <span className="bgi" style={{ backgroundImage: `url(${active.pic})` }} />
        <span className="bgfd" />
      </div>
      <div className="hot_list">
        <div className="hot_banner_box">
          <div className="banner-top">
            <ul className="swiper-wrapper vodlist clearfix">
              {items.map((it) => (
                <li key={it.id} className="balist_item swiper-slide">
                  <Link
                    className="balist_thumb"
                    href={it.link}
                    title={it.name}
                    style={{ backgroundImage: `url(${it.pic})` }}
                  >
                    <span className="play hidden_xs" />
                    <div className="tagtip tagb">{it.tag}</div>
                    <div className="balist_titbox pic_text">
                      <p className="vodlist_title">{it.name}</p>
                      <p className="vodlist_sub">{it.sub}</p>
                    </div>
                    <span className="balist_bg" />
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