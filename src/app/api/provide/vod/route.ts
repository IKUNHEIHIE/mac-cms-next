import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmt(ts: number) {
  const d = new Date(ts * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function mapVod(v: Record<string, unknown>, detail: boolean, typeName: string) {
  const base: Record<string, unknown> = {
    vod_id: v.vodId,
    vod_name: v.vodName,
    type_id: v.typeId,
    type_name: typeName,
    vod_en: v.vodEn,
    vod_time: fmt(Number(v.vodTime) || 0),
    vod_remarks: v.vodRemarks,
    vod_play_from: v.vodPlayFrom,
    vod_pic: v.vodPic,
    vod_area: v.vodArea,
    vod_lang: v.vodLang,
    vod_year: v.vodYear,
    vod_letter: v.vodLetter,
    vod_actor: v.vodActor,
    vod_director: v.vodDirector,
    vod_class: v.vodClass,
    vod_score: v.vodScore,
    vod_state: v.vodState,
    vod_serial: v.vodSerial,
  };
  if (detail) {
    Object.assign(base, {
      vod_sub: v.vodSub,
      vod_blurb: v.vodBlurb,
      vod_content: v.vodContent,
      vod_total: v.vodTotal,
      vod_isend: v.vodIsend,
      vod_hits: v.vodHits,
      vod_up: v.vodUp,
      vod_down: v.vodDown,
      vod_score_all: v.vodScoreAll,
      vod_score_num: v.vodScoreNum,
      vod_play_server: v.vodPlayServer,
      vod_play_note: v.vodPlayNote,
      vod_play_url: v.vodPlayUrl,
      vod_down_from: v.vodDownFrom,
      vod_down_server: v.vodDownServer,
      vod_down_note: v.vodDownNote,
      vod_down_url: v.vodDownUrl,
      vod_douban_id: v.vodDoubanId,
      vod_douban_score: v.vodDoubanScore,
    });
  }
  return base;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ac = url.searchParams.get("ac") || "list";
  const pg = Math.max(1, Number(url.searchParams.get("pg")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const t = Number(url.searchParams.get("t")) || 0;
  const wd = (url.searchParams.get("wd") || "").trim();
  const ids = (url.searchParams.get("ids") || "").split(",").map(Number).filter((n) => n > 0);
  const detail = ac === "detail";

  const where: Record<string, unknown> = { vodStatus: 1 };
  if (t) where.OR = [{ typeId: t }, { typeId1: t }];
  if (wd) where.OR = [{ vodName: { contains: wd } }, { vodActor: { contains: wd } }, { vodEn: { contains: wd } }];
  if (ids.length) where.vodId = { in: ids };

  const [types, total, rows] = await Promise.all([
    prisma.type.findMany({ select: { typeId: true, typeName: true, typePid: true } }),
    prisma.vod.count({ where: where as never }),
    prisma.vod.findMany({
      where: where as never,
      orderBy: { vodTime: "desc" },
      skip: (pg - 1) * limit,
      take: limit,
    }),
  ]);
  const typeMap = new Map(types.map((x) => [x.typeId, x.typeName]));
  const list = rows.map((v) => mapVod(v as unknown as Record<string, unknown>, detail, typeMap.get(v.typeId) || ""));
  const body = {
    code: 1,
    msg: "数据列表",
    page: pg,
    pagecount: Math.max(1, Math.ceil(total / limit)),
    limit,
    total,
    list,
    class: types.filter((x) => x.typePid === 0).map((x) => ({ type_id: x.typeId, type_pid: 0, type_name: x.typeName })),
  };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}