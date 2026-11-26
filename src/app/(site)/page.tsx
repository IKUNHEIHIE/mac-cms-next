import Link from "next/link";
import Banner, { type BannerItem } from "@/components/site/Banner";
import VodCard from "@/components/site/VodCard";
import AdSlot from "@/components/site/AdSlot";
import { prisma } from "@/lib/db";
import { getSiteContext } from "@/lib/site";
import { poster, vodLink } from "@/lib/maccms";
import { VOD_BANNER_SELECT, vodCardSelect } from "@/lib/vodQuery";

export default async function HomePage() {
  const { settings, types } = await getSiteContext();
  const theme = settings.theme;
  const homeTypeIds = theme.categoryHomeIds?.length ? theme.categoryHomeIds : types.slice(0, 4).map((t) => t.typeId);

  const [bannerVods, hot, sections, arts, links, topicList] = await Promise.all([
    prisma.vod.findMany({
      where: { vodStatus: 1, vodLevel: 9 },
      orderBy: { vodTime: "desc" },
      take: 6,
      select: VOD_BANNER_SELECT,
    }),
    prisma.vod.findMany({
      where: { vodStatus: 1 },
      orderBy: [{ vodHits: "desc" }, { vodTime: "desc" }],
      take: theme.hotNum || 12,
      select: vodCardSelect(theme.playlink),
    }),
    Promise.all(
      homeTypeIds.slice(0, 4).map(async (id) => {
        const type = types.find((t) => t.typeId === id);
        const list = await prisma.vod.findMany({
          where: { vodStatus: 1, typeId1: id },
          orderBy: { vodTime: "desc" },
          take: theme.homeNum || 12,
          select: vodCardSelect(theme.playlink),
        });
        return { type, list };
      }),
    ),
    prisma.art.findMany({
      where: { artStatus: 1 },
      orderBy: { artTime: "desc" },
      take: 4,
      select: { artId: true, artName: true, artPic: true, artBlurb: true },
    }),
    prisma.link.findMany({ orderBy: { linkSort: "asc" }, take: 8, select: { linkId: true, linkName: true, linkUrl: true } }),
    prisma.topic.findMany({
      where: { topicStatus: 1 },
      orderBy: { topicSort: "asc" },
      take: 3,
      select: { topicId: true, topicName: true, topicPic: true, topicPicSlide: true, topicBlurb: true, topicRemarks: true },
    }),
  ]);

  const bannerRaw: BannerItem[] = [
    ...topicList.map((t) => ({
      id: -t.topicId,
      name: t.topicName,
      pic: t.topicPicSlide || t.topicPic || bannerVods[0]?.vodPic || "",
      sub: t.topicBlurb || t.topicRemarks || "",
      link: `/topic/${t.topicId}`,
      tag: "专题",
    })),
    ...bannerVods.map((v) => ({
      id: v.vodId,
      name: v.vodName,
      pic: v.vodPicSlide || v.vodPic || "",
      sub: `[${v.vodRemarks || "已完结"}] ${v.vodActor || v.vodClass || ""}`,
      link: vodLink(v, theme.playlink),
      tag: v.vodClass || "热播",
    })),
  ];
  const seenPics = new Set<string>();
  const bannerItems: BannerItem[] = bannerRaw
    .filter((b) => {
      if (!b.pic || seenPics.has(b.pic)) return false;
      seenPics.add(b.pic);
      return true;
    })
    .slice(0, 6);

  return (
    <>
      {theme.banner ? <Banner items={bannerItems} /> : null}
      <div className="container">
        {theme.notice ? (
          <div className="mc_notice">
            <strong>公告：</strong>
            {theme.notice}
          </div>
        ) : null}
        <AdSlot slot="home" />

        <div className="vod_row tit_up">
          <div className="pannel">
            <div className="pannel_head clearfix">
              <span className="text_muted pull_left">
                <Link href="/map">
                  最新<em className="new_date">{hot.length}</em>
                </Link>
              </span>
              <h2 className="title">
                <i className="iconfont">{String.fromCharCode(0xe631)}</i>
                {theme.hotTitle || "热播推荐"}
              </h2>
            </div>
            <div className="cbox_list">
              <ul className="vodlist vodlist_wi list_v12 clearfix">
                {hot.map((v, i) => (
                  <VodCard key={v.vodId} vod={v} playlink={theme.playlink} num={i + 1} />
                ))}
              </ul>
            </div>
          </div>
        </div>

        {sections.map(({ type, list }) =>
          type && list.length ? (
            <div className="vod_row tit_up" key={type.typeId}>
              <div className="pannel">
                <div className="pannel_head clearfix">
                  <Link className="text_muted pull_left" href={`/vod/type/${type.typeId}`}>
                    更多
                    <i className="iconfont more_i">{String.fromCharCode(0xe623)}</i>
                  </Link>
                  <h2 className="title">{type.typeName}</h2>
                  <span className="hidden_xs pull_left">
                    {list.slice(0, 3).map((v, i) => (
                      <span key={v.vodId}>
                        {i > 0 ? <span className="split_line" /> : null}
                        <Link
                          href={vodLink(v, theme.playlink)}
                          title={v.vodName}
                          className="text_muted"
                        >
                          {v.vodName.length > 12 ? `${v.vodName.slice(0, 12)}…` : v.vodName}
                        </Link>
                      </span>
                    ))}
                  </span>
                </div>
                <div className="cbox_list">
                  <ul className="vodlist vodlist_wi list_v12 clearfix">
                    {list.map((v, i) => (
                      <VodCard key={v.vodId} vod={v} playlink={theme.playlink} num={i + 1} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null,
        )}

        {arts.length ? (
          <div className="row tit_up">
            <div className="pannel">
              <div className="pannel_head clearfix">
                <Link className="text_muted pull_left" href="/art/type/5">
                  更多
                  <i className="iconfont more_i">{String.fromCharCode(0xe623)}</i>
                </Link>
                <h2 className="title">
                  <i className="iconfont">{String.fromCharCode(0xe630)}</i>影视资讯
                </h2>
              </div>
              <ul className="arthom_list list_v5 clearfix">
                {arts.map((a) => (
                  <li className="arthom_item" key={a.artId}>
                    <Link
                      className="arthom_thumb"
                      href={`/art/detail/${a.artId}`}
                      title={a.artName}
                      style={{ backgroundImage: `url(${poster(a.artPic)})` }}
                    >
                      <span className="look" />
                    </Link>
                    <div className="arthom_titbox">
                      <p className="arthom_title">
                        <Link href={`/art/detail/${a.artId}`} title={a.artName}>
                          {a.artName}
                        </Link>
                      </p>
                      <p className="arthom_sub">{a.artBlurb}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {links.length ? (
          <div className="row">
            <div className="pannel">
              <div className="pannel_head clearfix">
                <h3 className="title">友情链接</h3>
              </div>
              <ul className="links_list clearfix" style={{ padding: "0.2rem 0", listStyle: "none" }}>
                {links.map((l) => (
                  <li key={l.linkId} style={{ float: "left", margin: "0 0.3rem 0.15rem 0" }}>
                    <a href={l.linkUrl} target="_blank" rel="noreferrer" className="text_muted">
                      {l.linkName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}