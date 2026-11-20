import Link from "next/link";
import VodCard from "@/components/site/VodCard";
import Pagination from "@/components/site/Pagination";
import RankList from "@/components/site/RankList";
import AdSlot from "@/components/site/AdSlot";
import { prisma } from "@/lib/db";
import { getSiteContext, pageParam } from "@/lib/site";
import { vodPlayLink } from "@/lib/maccms";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Search = { wd?: string; page?: string; class?: string; area?: string; year?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }) {
  const { wd } = await searchParams;
  return { title: wd ? `搜索 ${wd}` : "搜索" };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const wd = (sp.wd || "").trim();
  const page = pageParam(sp.page);
  const size = 36;
  const { settings } = await getSiteContext();
  const theme = settings.theme;

  const where: Prisma.VodWhereInput = { vodStatus: 1 };
  if (wd) {
    where.OR = [
      { vodName: { contains: wd } },
      { vodActor: { contains: wd } },
      { vodDirector: { contains: wd } },
      { vodBlurb: { contains: wd } },
    ];
  }
  if (sp.class) where.vodClass = { contains: sp.class };
  if (sp.area) where.vodArea = { contains: sp.area };
  if (sp.year) where.vodYear = sp.year;

  const [total, list, rank, types] = await Promise.all([
    wd || sp.class || sp.area || sp.year ? prisma.vod.count({ where }) : Promise.resolve(0),
    wd || sp.class || sp.area || sp.year
      ? prisma.vod.findMany({ where, orderBy: { vodTime: "desc" }, skip: (page - 1) * size, take: size })
      : prisma.vod.findMany({ where: { vodStatus: 1 }, orderBy: { vodTime: "desc" }, take: 18 }),
    prisma.vod.findMany({ orderBy: { vodHitsWeek: "desc" }, take: 10 }),
    prisma.type.findMany({ select: { typeId: true, typeName: true } }),
  ]);
  const typeMap = new Map(types.map((t) => [t.typeId, t.typeName]));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const queried = Boolean(wd || sp.class || sp.area || sp.year);

  return (
    <div className="container">
      <div className="left_row fl">
        <div className="pannel search_box clearfix">
          <div className="pannel_head clearfix">
            <h3 className="title">
              {queried ? (
                <>
                  搜索到与“<em>{wd || sp.class || sp.area || sp.year}</em>”相关的<em>{total}</em>条结果
                </>
              ) : (
                <>请输入关键字搜索影视</>
              )}
            </h3>
          </div>
          <AdSlot slot="search" />
          <ul className="vodlist clearfix">
            {list.map((v, i) => (
              <VodCard key={v.vodId} vod={v} playlink={theme.playlink} num={i + 1} />
            ))}
          </ul>
          {queried && list.length === 0 ? (
            <div className="search_tips">
              <p>很抱歉，暂无相关视频！如需提醒管理员添加该视频请前往留言板。</p>
              <p>提示（如果搜索词错误也将无法搜到，可尝试简化搜索词）</p>
            </div>
          ) : null}
          {queried ? (
            <Pagination page={page} pageCount={pageCount} basePath="/vod/search" query={{ wd, class: sp.class, area: sp.area, year: sp.year }} />
          ) : null}
        </div>
        {!queried ? (
          <div className="pannel clearfix">
            <div className="pannel_head clearfix">
              <Link className="text_muted pull_right" href="/map">
                更多
              </Link>
              <h3 className="title">最新更新</h3>
            </div>
            <AdSlot slot="search" />
          <ul className="vodlist clearfix">
              {list.map((v, i) => (
                <VodCard key={`n${v.vodId}`} vod={v} playlink={theme.playlink} num={i + 1} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="right_row fr pa_left hidden_xs hidden_mi">
        <div className="pannel clearfix">
          <div className="pannel_head clearfix">
            <h3 className="title">热播影视</h3>
          </div>
          <RankList
            playlink={theme.playlink}
            items={rank.map((v) => ({
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
  );
}