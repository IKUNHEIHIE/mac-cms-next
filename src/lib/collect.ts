import { prisma } from "./db";

export const LZ_API = "https://lzizy.net/api.php/provide/vod/";

type LzClass = { type_id: number; type_pid: number; type_name: string };
type LzVod = Record<string, string | number | undefined>;

type LzResponse = {
  code?: number;
  msg?: string;
  page?: number;
  pagecount?: number;
  total?: number;
  list?: LzVod[];
  class?: LzClass[];
};

const PLAYER_NOTE: Record<string, string> = {
  liangzi: "量子资源",
  lzm3u8: "LZ线路",
};

async function lzFetch(url: string): Promise<LzResponse> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`资源站返回 ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as LzResponse;
  } catch {
    throw new Error("资源站返回的不是有效 JSON");
  }
}

function str(v: unknown) {
  return v === undefined || v === null ? "" : String(v);
}

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function ts(v: unknown) {
  const s = str(v);
  if (!s) return Math.floor(Date.now() / 1000);
  const t = new Date(s.replace(" ", "T")).getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : Math.floor(Date.now() / 1000);
}

export function mapLzVod(
  v: LzVod,
  typeParent: Record<number, number>,
  opts: { level?: number } = {},
) {
  const typeId = num(v.type_id);
  const vid = num(v.vod_id);
  const hits = Math.abs((vid * 7919) % 90000) + 1200;
  const score = Number(v.vod_score) > 0 ? Number(v.vod_score) : Number(((vid % 30) / 10 + 6.5).toFixed(1));
  const from = str(v.vod_play_from);
  const note = from
    .split("$$$")
    .filter(Boolean)
    .map((f) => PLAYER_NOTE[f] || f)
    .join(",");
  return {
    vodId: vid,
    typeId,
    typeId1: typeParent[typeId] || 0,
    groupId: 0,
    vodName: str(v.vod_name),
    vodSub: str(v.vod_sub),
    vodEn: str(v.vod_en),
    vodStatus: 1,
    vodLetter: str(v.vod_letter),
    vodColor: str(v.vod_color),
    vodTag: str(v.vod_tag),
    vodClass: str(v.vod_class),
    vodPic: str(v.vod_pic),
    vodPicThumb: str(v.vod_pic_thumb) || str(v.vod_pic),
    vodPicSlide: str(v.vod_pic_slide) || str(v.vod_pic),
    vodPicScreenshot: "",
    vodActor: str(v.vod_actor),
    vodDirector: str(v.vod_director),
    vodWriter: str(v.vod_writer),
    vodBehind: str(v.vod_behind),
    vodBlurb: str(v.vod_blurb),
    vodRemarks: str(v.vod_remarks),
    vodPubdate: str(v.vod_pubdate),
    vodTotal: num(v.vod_total),
    vodSerial: str(v.vod_serial) || "0",
    vodTv: str(v.vod_tv),
    vodWeekday: str(v.vod_weekday),
    vodArea: str(v.vod_area),
    vodLang: str(v.vod_lang),
    vodYear: str(v.vod_year),
    vodVersion: str(v.vod_version),
    vodState: str(v.vod_state),
    vodAuthor: str(v.vod_author),
    vodJumpurl: str(v.vod_jumpurl),
    vodTpl: "",
    vodTplPlay: "",
    vodTplDown: "",
    vodIsend: num(v.vod_isend),
    vodLock: 0,
    vodLevel: opts.level || num(v.vod_level),
    vodCopyright: 0,
    vodPoints: num(v.vod_points),
    vodPointsPlay: num(v.vod_points_play),
    vodPointsDown: num(v.vod_points_down),
    vodHits: hits,
    vodHitsDay: Math.floor(hits / 8),
    vodHitsWeek: Math.floor(hits / 3),
    vodHitsMonth: Math.floor(hits / 2),
    vodDuration: str(v.vod_duration),
    vodUp: Math.abs(vid % 800),
    vodDown: Math.abs(vid % 37),
    vodScore: score,
    vodScoreAll: Math.round(score * 100),
    vodScoreNum: 100,
    vodTime: ts(v.vod_time),
    vodTimeAdd: ts(v.vod_time_add) || ts(v.vod_time),
    vodTimeHits: ts(v.vod_time),
    vodTimeMake: 0,
    vodTrysee: 0,
    vodDoubanId: num(v.vod_douban_id),
    vodDoubanScore: num(v.vod_douban_score),
    vodReurl: str(v.vod_reurl),
    vodRelVod: str(v.vod_rel_vod),
    vodRelArt: "",
    vodPwd: "",
    vodPwdUrl: "",
    vodPwdPlay: "",
    vodPwdPlayUrl: "",
    vodPwdDown: "",
    vodPwdDownUrl: "",
    vodContent: str(v.vod_content) || str(v.vod_blurb),
    vodPlayFrom: from,
    vodPlayServer: "no",
    vodPlayNote: note,
    vodPlayUrl: str(v.vod_play_url),
    vodDownFrom: "",
    vodDownServer: "no",
    vodDownNote: "",
    vodDownUrl: "",
    vodPlot: num(v.vod_plot),
    vodPlotName: "",
    vodPlotDetail: "",
  };
}

export async function importTypes(api = LZ_API) {
  const data = await lzFetch(`${api}?ac=list`);
  const classes = data.class || [];
  const parents: Record<number, number> = {};
  for (const c of classes) parents[c.type_id] = c.type_pid || 0;
  const extend = JSON.stringify({
    class: "",
    area: "",
    lang: "",
    year: "",
    star: "",
    director: "",
    state: "",
    version: "",
  });
  for (const c of classes) {
    await prisma.type.upsert({
      where: { typeId: c.type_id },
      update: {
        typeName: c.type_name,
        typePid: c.type_pid || 0,
        typeStatus: 1,
        typeMid: 1,
      },
      create: {
        typeId: c.type_id,
        typeName: c.type_name,
        typeEn: `type${c.type_id}`,
        typeSort: c.type_id,
        typeMid: 1,
        typePid: c.type_pid || 0,
        typeStatus: 1,
        typeTpl: "type.html",
        typeTplList: "show.html",
        typeTplDetail: "detail.html",
        typeTplPlay: "play.html",
        typeTplDown: "down.html",
        typeExtend: extend,
      },
    });
  }
  await prisma.type.upsert({
    where: { typeId: 5 },
    update: {},
    create: {
      typeId: 5,
      typeName: "影视资讯",
      typeEn: "news",
      typeSort: 5,
      typeMid: 2,
      typePid: 0,
      typeStatus: 1,
      typeTpl: "type.html",
      typeTplList: "art/type.html",
      typeTplDetail: "art/detail.html",
      typeExtend: extend,
    },
  });
  return { count: classes.length + 1, parents };
}

export async function collectVods(options: {
  api?: string;
  pages?: number;
  startPage?: number;
  typeId?: number;
  limit?: number;
  markLevel?: boolean;
}) {
  const api = options.api || LZ_API;
  const pages = Math.max(1, Math.min(options.pages ?? 2, 30));
  const startPage = Math.max(1, options.startPage ?? 1);
  const limit = options.limit ?? pages * 20;
  const typeRows = await prisma.type.findMany({ select: { typeId: true, typePid: true } });
  const parent: Record<number, number> = {};
  for (const t of typeRows) parent[t.typeId] = t.typePid;

  let imported = 0;
  let updated = 0;
  let seen = 0;
  let pagecount = 0;

  outer: for (let page = startPage; page < startPage + pages; page++) {
    const qs = new URLSearchParams({ ac: "detail", pg: String(page) });
    if (options.typeId) qs.set("t", String(options.typeId));
    const data = await lzFetch(`${api}?${qs.toString()}`);
    pagecount = data.pagecount || pagecount;
    const list = data.list || [];
    if (!list.length) break;
    for (let i = 0; i < list.length; i++) {
      if (seen >= limit) break outer;
      seen++;
      const mapped = mapLzVod(list[i], parent, {
        level: options.markLevel && seen <= 12 ? 9 : undefined,
      });
      if (!mapped.vodId || !mapped.vodName) continue;
      const exists = await prisma.vod.findUnique({ where: { vodId: mapped.vodId }, select: { vodId: true } });
      await prisma.vod.upsert({
        where: { vodId: mapped.vodId },
        update: { ...mapped, vodTime: mapped.vodTime },
        create: mapped,
      });
      if (exists) updated++;
      else imported++;
    }
  }
  return { imported, updated, pagecount, total: seen };
}