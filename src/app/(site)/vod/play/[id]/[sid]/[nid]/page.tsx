import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSiteContext } from "@/lib/site";
import { parsePlaySources, poster, vodPlayLink } from "@/lib/maccms";
import { getSessionUser } from "@/lib/auth";
import { getExtra } from "@/lib/extraSettings";
import Player from "@/components/site/Player";
import PlayTracker from "@/components/site/PlayTracker";
import SourceTabs from "@/components/site/SourceTabs";
import VodCard from "@/components/site/VodCard";
import RankList from "@/components/site/RankList";
import CommentBox, { type CommentRow } from "@/components/site/CommentBox";
import Icon from "@/components/site/Icon";
import AdSlot from "@/components/site/AdSlot";
import { VOD_RANK_SELECT, vodCardSelect } from "@/lib/vodQuery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vod = await prisma.vod.findUnique({ where: { vodId: Number(id) } });
  return { title: vod ? `正在播放 ${vod.vodName}` : "在线播放" };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string; sid: string; nid: string }>;
}) {
  const p = await params;
  const vodId = Number(p.id);
  const vod = await prisma.vod.findUnique({ where: { vodId } });
  if (!vod) notFound();

  const { settings } = await getSiteContext();
  const theme = settings.theme;
  const extra = await getExtra();
  const sources = parsePlaySources(vod, extra.players);
  if (!sources.length) {
    return (
      <div className="container">
        <div className="mc_empty">该影片暂无播放资源</div>
      </div>
    );
  }

  const reqSid = Number(p.sid);
  const source = sources.find((s) => s.sid === reqSid) || sources.find((s) => s.urls.some((u) => /\.(m3u8|mp4)/i.test(u.url))) || sources[0];
  const reqNid = Number(p.nid);
  const nid = Math.min(Math.max(1, Number.isFinite(reqNid) ? reqNid : 1), source.urls.length);
  const episode = source.urls[nid - 1];
  const prev = nid > 1 ? source.urls[nid - 2] : null;
  const next = nid < source.urls.length ? source.urls[nid] : null;

  const [related, rankVods, types, comments, session, type, playerRows] = await Promise.all([
    prisma.vod.findMany({
      where: { typeId: vod.typeId, vodId: { not: vod.vodId }, vodStatus: 1 },
      orderBy: { vodTime: "desc" },
      take: 12,
      select: vodCardSelect(theme.playlink),
    }),
    prisma.vod.findMany({
      where: { vodStatus: 1 },
      orderBy: { vodHits: "desc" },
      take: 10,
      select: VOD_RANK_SELECT,
    }),
    prisma.type.findMany({ select: { typeId: true, typeName: true } }),
    prisma.comment.findMany({ where: { commentMid: 1, commentRid: vod.vodId, commentStatus: 1 }, orderBy: { commentTime: "desc" }, take: 30 }),
    getSessionUser(),
    prisma.type.findUnique({ where: { typeId: vod.typeId } }),
    prisma.collect.findMany({
      where: { collectPlayerStatus: 1, NOT: { collectPlayerFile: "" } },
      orderBy: { collectId: "asc" },
      select: { collectPlayerName: true, collectPlayerFile: true, collectPlayerType: true, collectPlayerFrom: true },
    }),
  ]);
  const user = session ? await prisma.user.findUnique({ where: { userId: session.uid } }) : null;
  const typeMap = new Map(types.map((t) => [t.typeId, t.typeName]));
  const matchedPlayer = playerRows.find((p) => {
    const codes = (p.collectPlayerFrom || "").split(",").map((v) => v.trim());
    return codes.includes("*") || codes.includes(source.from);
  });
  const customPlayer = matchedPlayer?.collectPlayerFile
    ? {
        file: matchedPlayer.collectPlayerFile,
        kind: (matchedPlayer.collectPlayerType === "js" ? "js" : "html") as "html" | "js",
        name: matchedPlayer.collectPlayerName || undefined,
      }
    : undefined;
  const commentRows: CommentRow[] = comments.map((c) => ({
    commentId: c.commentId,
    commentName: c.commentName,
    commentTime: c.commentTime,
    commentContent: c.commentContent || "",
    commentUp: c.commentUp,
  }));

  return (
    <>
      <div id="play_page">
        <div className="hot_banner">
          <div className="bgi_box">
            <span className="bgi" style={{ backgroundImage: `url(${poster(vod.vodPicSlide || vod.vodPic)})` }} />
            <span className="bgfd" />
          </div>
        </div>
        <div className="play_boxbg">
          <div className="container">
            <div className="play_box play_video">
              <div className="left_row fl">
                <div className="player_video embed-responsive embed-responsive-16by9 clearfix">
                  <Player src={episode.url} poster={poster(vod.vodPic)} title={`${vod.vodName} ${episode.name}`} from={source.from} custom={customPlayer} />
                </div>
                <div className="play_but bline">
                  <ul>
                    <li>
                      <a className="play_pl hidden_xs" href="#pinglun">
                        <Icon code={0xe632} />
                        评论
                      </a>
                      <a href="#bofy">
                        <Icon code={0xe62a} />
                        线路
                      </a>
                      <a href={`/gbook?report=${vod.vodId}`}>
                        <Icon code={0xe612} />
                        报错
                      </a>
                      <Link href={`/vod/detail/${vod.vodId}`}>
                        <Icon code={0xe621} />
                        详情
                      </Link>
                      {prev ? (
                        <Link href={`/vod/play/${vod.vodId}/${source.sid}/${prev.nid}`}>
                          <Icon code={0xe626} className="pre-t" />
                          上集
                        </Link>
                      ) : (
                        <span className="btns_disad">
                          <Icon code={0xe626} />
                          上集
                        </span>
                      )}
                      {next ? (
                        <Link href={`/vod/play/${vod.vodId}/${source.sid}/${next.nid}`}>
                          下集&nbsp;
                          <Icon code={0xe62c} className="next-p next-t" />
                        </Link>
                      ) : (
                        <span className="btns_disad">
                          下集&nbsp;
                          <Icon code={0xe62c} />
                        </span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="right_row fr hidden_xs hidden_mi" style={{ position: "relative" }}>
                <div className="play_box_right">
                  <div className="play_namebox">
                    <h3 className="title">{vod.vodName}</h3>
                    <span className="fenlei">{type?.typeName}</span>
                  </div>
                  <div className="play_infobox">
                    <div className="play_vlist cblock">
                      <div
                        className="play_vlist_thumb vnow"
                        style={{ backgroundImage: `url(${poster(vod.vodPic)})` }}
                      />
                      <div className="play_vlist_text vnow">
                        <p className="play_vlist_title">{vod.vodName}</p>
                        <p className="play_vlist_now">{episode.name}</p>
                      </div>
                    </div>
                    <div className="play_clike">猜你喜欢</div>
                    <ul className="play_vlist_box">
                      {related.slice(0, 4).map((v) => (
                        <li key={v.vodId} className="play_vlist">
                          <Link
                            className="play_vlist_thumb"
                            href={vodPlayLink(v)}
                            style={{ backgroundImage: `url(${poster(v.vodPic)})` }}
                          />
                          <div className="play_vlist_text">
                            <p className="play_vlist_title">
                              <Link href={vodPlayLink(v)}>{v.vodName}</Link>
                            </p>
                            <p className="play_vlist_now">{v.vodRemarks || "更新中"}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="left_row fl">
            <div className="pannel play_pan clearfix">
              <div className="player">
                <div className="player_detail detail cblock">
                  <div className="video_title fl">
                    <h2 className="title margin_0">{vod.vodName}</h2>
                  </div>
                  <div className="play_now">
                    <a className="flip" href="#desc">
                      简介&nbsp;
                      <span className="xs1">
                        <Icon code={0xe623} />
                      </span>
                    </a>
                  </div>
                </div>
                <div className="play_text" id="desc">
                  <p className="nstem data ms_p margin_0">
                    {vod.vodScore > 0 ? (
                      <span className="text_score">
                        {vod.vodScore.toFixed(1)}
                        <span className="split_line" />
                      </span>
                    ) : null}
                    {vod.vodYear} {vod.vodArea} {vod.vodClass}
                  </p>
                  <div className="panel play_content">
                    <p>导演：{vod.vodDirector || "未知"}</p>
                    <p>主演：{vod.vodActor || "未知"}</p>
                    <p style={{ whiteSpace: "pre-line" }}>{vod.vodBlurb || vod.vodContent || "暂无"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pannel clearfix" id="bofy">
              <div className="pannel_head clearfix">
                <h3 className="title">播放列表</h3>
              </div>
              <SourceTabs vodId={vod.vodId} sources={sources} sid={source.sid} nid={nid} />
            </div>

            <div className="pannel hidden_mb clearfix">
              <div className="pannel_head clearfix">
                <h3 className="title">猜你喜欢</h3>
              </div>
              <ul className="vodlist vodlist_sm list_scroll clearfix">
                {related.slice(0, 8).map((v, i) => (
                  <VodCard key={v.vodId} vod={v} playlink={theme.playlink} num={i + 1} />
                ))}
              </ul>
            </div>

            <div className="pannel clearfix">
              <div className="pannel_head clearfix">
                <h3 className="title">相关推荐</h3>
              </div>
              <ul className="vodlist vodlist_sm list_scroll clearfix">
                {related.slice(4, 16).map((v, i) => (
                  <VodCard key={`rel${v.vodId}`} vod={v} playlink={theme.playlink} num={i + 1} />
                ))}
              </ul>
            </div>

            <AdSlot slot="playBottom" />

            {settings.site.comment_status ? (
              <div className="pannel clearfix" id="pinglun">
                <div className="pannel_head clearfix">
                  <span className="pull_right">共&nbsp;{commentRows.length}&nbsp;条评论</span>
                  <h3 className="title">评论</h3>
                </div>
                <CommentBox rid={vod.vodId} initial={commentRows} canPost={Boolean(user)} userName={user?.userNickName || user?.userName} />
              </div>
            ) : null}
          </div>

          <div className="right_row pa_left fr hidden_xs hidden_mi">
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
      </div>
      <PlayTracker rid={vod.vodId} sid={source.sid} nid={nid} loggedIn={Boolean(user)} />
    </>
  );
}