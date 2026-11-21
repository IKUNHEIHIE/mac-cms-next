import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSiteContext } from "@/lib/site";
import { parsePlaySources, poster, vodLink, vodPlayLink } from "@/lib/maccms";
import { getSessionUser } from "@/lib/auth";
import { getExtra } from "@/lib/extraSettings";
import VodCard from "@/components/site/VodCard";
import RankList from "@/components/site/RankList";
import SourceTabs from "@/components/site/SourceTabs";
import FavButton from "@/components/site/FavButton";
import CommentBox, { type CommentRow } from "@/components/site/CommentBox";
import Icon from "@/components/site/Icon";
import AdSlot from "@/components/site/AdSlot";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vod = await prisma.vod.findUnique({ where: { vodId: Number(id) } });
  return {
    title: vod?.vodName || "影片详情",
    description: vod?.vodBlurb || vod?.vodContent?.slice(0, 120) || "",
  };
}

export default async function VodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vodId = Number(id);
  const vod = await prisma.vod.findUnique({ where: { vodId } });
  if (!vod) notFound();

  const { settings } = await getSiteContext();
  const theme = settings.theme;
  const extra = await getExtra();
  const [type, related, rankVods, types, comments, session] = await Promise.all([
    prisma.type.findUnique({ where: { typeId: vod.typeId } }),
    prisma.vod.findMany({ where: { typeId: vod.typeId, vodId: { not: vod.vodId }, vodStatus: 1 }, orderBy: { vodTime: "desc" }, take: 12 }),
    prisma.vod.findMany({ orderBy: { vodHits: "desc" }, take: 10 }),
    prisma.type.findMany({ select: { typeId: true, typeName: true } }),
    prisma.comment.findMany({ where: { commentMid: 1, commentRid: vod.vodId, commentStatus: 1 }, orderBy: { commentTime: "desc" }, take: 30 }),
    getSessionUser(),
  ]);
  const user = session ? await prisma.user.findUnique({ where: { userId: session.uid } }) : null;
  const typeMap = new Map(types.map((t) => [t.typeId, t.typeName]));
  const sources = parsePlaySources(vod, extra.players);
  const first = vodPlayLink(vod);
  const playCount = sources.reduce((n, s) => n + s.urls.length, 0);

  const commentRows: CommentRow[] = comments.map((c) => ({
    commentId: c.commentId,
    commentName: c.commentName,
    commentTime: c.commentTime,
    commentContent: c.commentContent || "",
    commentUp: c.commentUp,
  }));

  return (
    <>
      <div className="hot_banner">
        <div className="bgi_box">
          <span className="bgi" style={{ backgroundImage: `url(${poster(vod.vodPicSlide || vod.vodPic)})` }} />
          <span className="bgfd" />
        </div>
        <div className="detail_list_box">
          <div className="detail_list">
            <div className="content_box clearfix">
              <div className="content_thumb fl">
                <Link
                  className="vodlist_thumb"
                  href={first}
                  title={vod.vodName}
                  style={{ backgroundImage: `url(${poster(vod.vodPic)})` }}
                >
                  <span className="play hidden_xs" />
                </Link>
              </div>
              <div className="content_detail content_top fl">
                <div className="pannel_head clearfix">
                  <span className="text_muted pull_right hidden_xs">
                    <FavButton rid={vod.vodId} loggedIn={Boolean(user)} />
                  </span>
                  <h2 className="title">{vod.vodName}</h2>
                </div>
                <div id="detail_rating" className="fn-clear">
                  <span className="text_score">{vod.vodScore > 0 ? vod.vodScore.toFixed(1) : "暂无评分"}</span>
                  <span className="split_line" />
                  <span style={{ color: "#999", fontSize: "0.3rem" }}>{vod.vodHits} 次播放</span>
                </div>
              </div>
              <div className="content_detail content_min fl">
                <ul>
                  <li className="data">
                    <span className="text_muted hidden_xs">年份：</span>
                    <Link href={`/vod/type/${vod.typeId}?year=${encodeURIComponent(vod.vodYear)}`}>{vod.vodYear || "未知"}</Link>
                    <span className="split_line" />
                    <span className="text_muted hidden_xs">地区：</span>
                    <Link href={`/vod/type/${vod.typeId}?area=${encodeURIComponent(vod.vodArea)}`}>{vod.vodArea || "未知"}</Link>
                    <span className="split_line" />
                    <span className="text_muted hidden_xs">类型：</span>
                    <Link href={`/vod/type/${vod.typeId}?class=${encodeURIComponent(vod.vodClass)}`}>{vod.vodClass || "未知"}</Link>
                  </li>
                  <li className="data">
                    <span>状态：</span>
                    <span className="data_style">{vod.vodRemarks || (Number(vod.vodSerial) > 0 ? `第${vod.vodSerial}集` : "已完结")}</span>
                    &nbsp;/&nbsp;<em>{type?.typeName}</em>
                  </li>
                  <li className="data">
                    <span>主演：</span>
                    {vod.vodActor || "未知"}
                  </li>
                  <li className="data">
                    <span>导演：</span>
                    {vod.vodDirector || "未知"}
                  </li>
                  <li className="desc hidden_xs">
                    <span className="left text_muted">简介：</span>
                    {(vod.vodBlurb || vod.vodContent || "暂无简介").replace(/<[^>]*>/g, "").slice(0, 60)}
                    &nbsp;
                    <a href="#desc">详细 &gt;</a>
                  </li>
                </ul>
              </div>
              <div className="content_detail content_min content_btn fl">
                <div className="playbtn">
                  <Link className="btn btn_play" href={first}>
                    <Icon code={0xe626} />
                    &nbsp;立即播放
                  </Link>
                  <Link href={`/vod/down/${vod.vodId}`} className="text_muted" style={{ marginLeft: "0.3rem", fontSize: "0.4rem" }}>
                    下载
                  </Link>
                  {vod.vodPlot ? (
                    <Link href={`/plot/${vod.vodId}`} className="text_muted" style={{ marginLeft: "0.3rem", fontSize: "0.4rem" }}>
                      分集剧情
                    </Link>
                  ) : null}
                  <span className="text_muted" style={{ marginLeft: "0.3rem", fontSize: "0.3rem" }}>
                    共 {playCount} 集
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="left_row fl">
          <div className="pannel clearfix" id="desc">
            <div className="pannel_head clearfix">
              <h3 className="title">剧情介绍</h3>
            </div>
            <div className="content_desc context clearfix">
              <span style={{ whiteSpace: "pre-line" }}>{vod.vodBlurb || vod.vodContent || "暂无"}</span>
            </div>
          </div>

          <div className="pannel clearfix" id="bofy">
            <div className="pannel_head clearfix">
              <h3 className="title">播放列表</h3>
            </div>
            <SourceTabs vodId={vod.vodId} sources={sources} />
          </div>

          <div className="pannel clearfix">
            <div className="pannel_head clearfix">
              <Link className="text_muted pull_right" href={`/vod/type/${vod.typeId}`}>
                更多
                <Icon code={0xe623} className="more_i" />
              </Link>
              <h3 className="title">猜你喜欢</h3>
            </div>
            <ul className="vodlist vodlist_sh list_scroll clearfix">
              {related.slice(0, 8).map((v, i) => (
                <VodCard key={v.vodId} vod={v} playlink={theme.playlink} num={i + 1} />
              ))}
            </ul>
          </div>

          <div className="pannel clearfix">
            <div className="pannel_head clearfix">
              <h3 className="title">相关推荐</h3>
            </div>
            <ul className="vodlist vodlist_sh list_scroll clearfix">
              {related.slice(0, 12).map((v, i) => (
                <VodCard key={`r${v.vodId}`} vod={v} playlink={theme.playlink} num={i + 1} />
              ))}
            </ul>
          </div>

          {settings.site.comment_status ? (
            <div className="pannel clearfix">
              <div className="pannel_head clearfix">
                <span className="pull_right">共&nbsp;{commentRows.length}&nbsp;条评论</span>
                <h3 className="title">评论</h3>
              </div>
              <CommentBox rid={vod.vodId} initial={commentRows} canPost={Boolean(user)} userName={user?.userNickName || user?.userName} />
            </div>
          ) : null}
        </div>

        <div className="right_row fr pa_left hidden_xs hidden_mi">
          <AdSlot slot="detailRight" />
          <div className="pannel clearfix">
            <div className="pannel_head clearfix">
              <h3 className="title">热播影视</h3>
            </div>
            <RankList
              playlink={theme.playlink}
              items={rankVods.map((v) => ({
                vodId: v.vodId,
                vodName: v.vodName,
                typeName: typeMap.get(v.typeId) || "",
                playHref: vodPlayLink(v),
                detailHref: `/vod/detail/${v.vodId}`,
              }))}
            />
          </div>
        </div>
      </div>
    </>
  );
}