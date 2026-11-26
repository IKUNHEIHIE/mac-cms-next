import Link from "next/link";
import { notFound } from "next/navigation";
import VodCard from "@/components/site/VodCard";
import Pagination from "@/components/site/Pagination";
import AdSlot from "@/components/site/AdSlot";
import { prisma } from "@/lib/db";
import { getSiteContext, typeFilters, pageParam } from "@/lib/site";
import type { Prisma } from "@prisma/client";
import { typeSeoFor } from "@/lib/typeSeo";
import { VOD_TOP_SELECT, typeVodWhere, vodCardSelect } from "@/lib/vodQuery";

export const dynamic = "force-dynamic";

type Params = { id: string };
type Search = { page?: string; by?: string; class?: string; area?: string; year?: string; letter?: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const type = await prisma.type.findUnique({ where: { typeId: Number(id) } });
  if (!type) return { title: "影视分类" };
  const seo = typeSeoFor(type.typeId, type.typeName);
  return {
    title: type.typeTitle || seo.title,
    description: type.typeDes || seo.description,
    keywords: type.typeKey || seo.keywords,
  };
}

export default async function TypePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const typeId = Number(id);
  const type = await prisma.type.findUnique({ where: { typeId } });
  if (!type) notFound();

  const { settings } = await getSiteContext();
  const theme = settings.theme;
  const children = await prisma.type.findMany({
    where: { typePid: typeId, typeStatus: 1 },
    orderBy: { typeSort: "asc" },
    select: { typeId: true, typeName: true },
  });
  const seo = typeSeoFor(type.typeId, type.typeName);
  const intro = type.typeDes || seo.description;
  const filters = typeFilters(type.typeExtend);
  const page = pageParam(sp.page);
  const size = 36;
  const by = sp.by || "time";
  const orderBy: Prisma.VodOrderByWithRelationInput =
    by === "hits" ? { vodHits: "desc" } : by === "score" ? { vodScore: "desc" } : { vodTime: "desc" };

  const isParent = type.typePid === 0;
  const where: Prisma.VodWhereInput = typeVodWhere(typeId, isParent);
  if (sp.class) where.vodClass = { contains: sp.class };
  if (sp.area) where.vodArea = { contains: sp.area };
  if (sp.year) where.vodYear = sp.year;
  if (sp.letter) where.vodLetter = sp.letter.toUpperCase();

  const [total, list, top] = await Promise.all([
    prisma.vod.count({ where }),
    prisma.vod.findMany({
      where,
      orderBy,
      skip: (page - 1) * size,
      take: size,
      select: vodCardSelect(theme.playlink),
    }),
    prisma.vod.findMany({
      where: typeVodWhere(typeId, isParent),
      orderBy: { vodHits: "desc" },
      take: 3,
      select: VOD_TOP_SELECT,
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / size));

  const filterLink = (key: keyof Search, value: string) => {
    const q = new URLSearchParams();
    for (const k of ["by", "class", "area", "year", "letter"] as const) {
      const v = sp[k];
      if (v && !(k === key && v === value)) q.set(k, v);
    }
    if (value && !(sp[key] === value)) q.set(key, value);
    const s = q.toString();
    return `/vod/type/${typeId}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container">
      <div className="vod_row tit_up">
        <div className="pannel clearfix">
          <div className="pannel_head clearfix">
            <span className="pull_right">共有 {total} 个影片</span>
            <h2 className="title">{type.typeName}</h2>
            <span className="hidden_xs pull_left">
              {top.map((v, i) => (
                <span key={v.vodId}>
                  {i > 0 ? <span className="split_line" /> : null}
                  <Link href={`/vod/detail/${v.vodId}`} title={v.vodName} className="text_muted">
                    {v.vodName.slice(0, 16)}
                  </Link>
                </span>
              ))}
            </span>
          </div>

          <p className="mc_type_intro">{intro}</p>

          <div className="wrapper_fl wrapper_tm" style={{ borderTop: 0 }}>
            <ul className="screen_list sx_tz clearfix" style={{ float: "left", listStyle: "none", margin: 0, padding: 0 }}>
              {[
                ["time", "按最新"],
                ["hits", "按最热"],
                ["score", "按评分"],
              ].map(([k, label]) => (
                <li key={k} className={by === k ? "hl_fl" : ""} style={{ float: "left", marginRight: "0.3rem" }}>
                  <Link href={filterLink("by", k)}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {children.length ? (
            <div className="screen_box clearfix" style={{ padding: "0.1rem 0 0.2rem" }}>
              {children.map((c) => (
                <Link
                  key={c.typeId}
                  href={`/vod/type/${c.typeId}`}
                  className="text_muted"
                  style={{ marginRight: "0.35rem", fontSize: "0.32rem" }}
                >
                  {c.typeName}
                </Link>
              ))}
            </div>
          ) : null}

          {(["class", "area", "year"] as const).map((key) =>
            filters[key].length ? (
              <div key={key} className="screen_box clearfix" style={{ padding: "0.1rem 0", borderTop: "1px dashed #f0f0f0" }}>
                <span className="text_muted" style={{ marginRight: "0.3rem", fontSize: "0.3rem" }}>
                  {key === "class" ? "类型" : key === "area" ? "地区" : "年份"}：
                </span>
                <Link href={filterLink(key, "")} className={!sp[key] ? "hl_fl" : "text_muted"} style={{ marginRight: "0.25rem", fontSize: "0.3rem" }}>
                  全部
                </Link>
                {filters[key].slice(0, 18).map((v) => (
                  <Link
                    key={v}
                    href={filterLink(key, v)}
                    className={sp[key] === v ? "hl_fl" : "text_muted"}
                    style={{ marginRight: "0.25rem", fontSize: "0.3rem" }}
                  >
                    {v}
                  </Link>
                ))}
              </div>
            ) : null,
          )}

          <AdSlot slot="list" />
          <ul className="vodlist vodlist_wi clearfix">
            {list.map((v, i) => (
              <VodCard key={v.vodId} vod={v} playlink={theme.playlink} num={i + 1} />
            ))}
          </ul>
          {list.length === 0 ? <div className="show_no">暂无数据</div> : null}
          <Pagination page={page} pageCount={pageCount} basePath={`/vod/type/${typeId}`} query={{ by, class: sp.class, area: sp.area, year: sp.year, letter: sp.letter }} />
        </div>
      </div>
    </div>
  );
}