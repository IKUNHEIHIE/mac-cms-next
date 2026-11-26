import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmt(ts: number) {
  const d = new Date(ts * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cdata(value: unknown) {
  return `<![CDATA[${String(value ?? "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
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
  const xml = url.searchParams.get("at") === "xml";
  const pg = Math.max(1, Number(url.searchParams.get("pg")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const t = Number(url.searchParams.get("t")) || 0;
  const hours = Math.max(0, Math.min(720, Number(url.searchParams.get("h")) || 0));
  const wd = (url.searchParams.get("wd") || "").trim();
  const ids = (url.searchParams.get("ids") || "").split(",").map(Number).filter((n) => n > 0);
  const detail = ac === "detail" || ac === "videolist";

  const where: Record<string, unknown> = { vodStatus: 1 };
  if (t) where.OR = [{ typeId: t }, { typeId1: t }];
  if (wd) where.OR = [{ vodName: { contains: wd } }, { vodActor: { contains: wd } }, { vodEn: { contains: wd } }];
  if (ids.length) where.vodId = { in: ids };
  if (hours) where.vodTime = { gte: Math.floor(Date.now() / 1000) - hours * 3600 };

  const [types, total, rows] = await Promise.all([
    prisma.type.findMany({ select: { typeId: true, typeName: true, typePid: true, typeMid: true } }),
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
  const classes = types.filter((x) => x.typeMid === 1).map((x) => ({ type_id: x.typeId, type_pid: x.typePid, type_name: x.typeName }));
  const pagecount = Math.max(1, Math.ceil(total / limit));
  if (xml) {
    const videos = rows
      .map((v) => {
        const typeName = typeMap.get(v.typeId) || "";
        const froms = String(v.vodPlayFrom || "").split("$$$");
        const urls = String(v.vodPlayUrl || "").split("$$$");
        const dd = froms
          .map((flag, index) => (urls[index] ? `<dd flag="${xmlEscape(flag)}">${cdata(urls[index])}</dd>` : ""))
          .join("");
        const common = `<last>${xmlEscape(fmt(Number(v.vodTime) || 0))}</last><id>${v.vodId}</id><tid>${v.typeId}</tid><name>${cdata(v.vodName)}</name><type>${xmlEscape(typeName)}</type>`;
        if (!detail) return `<video>${common}<dt>${cdata(String(v.vodPlayFrom || "").replace(/\$\$\$/g, ","))}</dt><note>${cdata(v.vodRemarks)}</note></video>`;
        return `<video>${common}<pic>${xmlEscape(v.vodPic)}</pic><lang>${xmlEscape(v.vodLang)}</lang><area>${xmlEscape(v.vodArea)}</area><year>${xmlEscape(v.vodYear)}</year><state>${xmlEscape(v.vodSerial)}</state><note>${cdata(v.vodRemarks)}</note><actor>${cdata(v.vodActor)}</actor><director>${cdata(v.vodDirector)}</director>${dd ? `<dl>${dd}</dl>` : ""}<des>${cdata(v.vodContent || v.vodBlurb || "")}</des></video>`;
      })
      .join("");
    const classXml = `<class>${classes.map((c) => `<ty id="${c.type_id}">${xmlEscape(c.type_name)}</ty>`).join("")}</class>`;
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?><rss version="5.1"><list page="${pg}" pagecount="${pagecount}" pagesize="${limit}" recordcount="${total}">${videos}</list>${classXml}</rss>`;
    return new Response(xmlBody, {
      headers: { "Content-Type": "text/xml; charset=utf-8", "Access-Control-Allow-Origin": "*" },
    });
  }
  const body = {
    code: 1,
    msg: "数据列表",
    page: pg,
    pagecount,
    limit,
    total,
    list,
    class: classes.filter((x) => x.type_pid === 0).map((x) => ({ type_id: x.type_id, type_pid: 0, type_name: x.type_name })),
  };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}