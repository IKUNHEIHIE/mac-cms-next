import { createHash } from "node:crypto";
import { prisma } from "./db";
import { safeFetch } from "./net";
import { typeSeoFor } from "./typeSeo";
import { syncVodSearchIds } from "./searchIndex";
import { CACHE_KEYS, bumpPublicCacheVersion, cacheDel } from "./redis";
import { parseXmlResponse, type LzClass, type LzResponse, type LzVod } from "./xmlCollect";

export const LZ_API = "https://lzizy.net/api.php/provide/vod/";

export type CollectBindings = Record<number, number>;

function normalizeApi(api: string) {
  return api.trim().replace(/\/+$/, "");
}

export function apiFlag(api: string) {
  return createHash("md5").update(normalizeApi(api)).digest("hex");
}

const PRIMARY_API = normalizeApi(LZ_API);

export function sourceIdOffset(api = LZ_API) {
  const normalized = normalizeApi(api);
  if (normalized === PRIMARY_API) return 0;
  const digest = createHash("sha1").update(normalized).digest();
  return 1_000_000_000 + (digest.readUInt32BE(0) % 100) * 10_000_000;
}

export async function getCollectBindings(api = LZ_API): Promise<CollectBindings> {
  const row = await prisma.setting.findUnique({ where: { key: "collect_bind" } });
  if (!row) return {};
  try {
    const all = JSON.parse(row.value) as Record<string, number>;
    const prefix = `${apiFlag(api)}_`;
    const out: CollectBindings = {};
    for (const [k, v] of Object.entries(all)) {
      if (k.startsWith(prefix)) out[Number(k.slice(prefix.length))] = Number(v) || 0;
    }
    return out;
  } catch {
    return {};
  }
}

export async function saveCollectBindings(api: string, bindings: CollectBindings) {
  const row = await prisma.setting.findUnique({ where: { key: "collect_bind" } });
  let all: Record<string, number> = {};
  if (row) {
    try {
      all = JSON.parse(row.value) as Record<string, number>;
    } catch {
      all = {};
    }
  }
  const prefix = `${apiFlag(api)}_`;
  for (const k of Object.keys(all)) if (k.startsWith(prefix)) delete all[k];
  for (const [remote, local] of Object.entries(bindings)) {
    if (Number(local) > 0) all[`${prefix}${remote}`] = Number(local);
  }
  await prisma.setting.upsert({
    where: { key: "collect_bind" },
    update: { value: JSON.stringify(all) },
    create: { key: "collect_bind", value: JSON.stringify(all) },
  });
  return bindings;
}

export type CollectFormat = "auto" | "json" | "xml";

export async function fetchRemoteTypes(api = LZ_API, format: CollectFormat = "auto") {
  const data = await lzFetch(`${api}?ac=list`, format);
  return data.class || [];
}

const SYSTEM_PARENT: Record<number, number> = { 35: 1, 46: 2, 52: 4 };

const PLAYER_NOTE: Record<string, string> = {
  liangzi: "量子资源",
  lzm3u8: "LZ线路",
};

function withFormat(url: string, format: CollectFormat) {
  if (format === "auto") return url;
  const parsed = new URL(url);
  if (format === "xml") parsed.searchParams.set("at", "xml");
  else parsed.searchParams.delete("at");
  return parsed.toString();
}

async function fetchText(url: string) {
  const res = await safeFetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      Accept: "application/json,text/xml,application/xml,text/plain,*/*",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`资源站返回 ${res.status}`);
  return res.text();
}

async function lzFetch(url: string, format: CollectFormat = "auto"): Promise<LzResponse> {
  const target = withFormat(url, format);
  const text = await fetchText(target);
  const isXml = format === "xml" || (format === "auto" && text.trimStart().startsWith("<"));
  if (isXml) {
    try {
      return parseXmlResponse(text);
    } catch (e) {
      throw new Error(`资源站 XML 解析失败：${e instanceof Error ? e.message : "格式错误"}`);
    }
  }
  try {
    const json = JSON.parse(text) as LzResponse;
    if (format === "auto" && !Array.isArray(json.list) && !Array.isArray(json.class)) {
      const xmlUrl = withFormat(url, "xml");
      if (xmlUrl !== target) {
        try {
          return parseXmlResponse(await fetchText(xmlUrl));
        } catch {}
      }
    }
    return json;
  } catch {
    if (format === "auto") {
      const xmlUrl = withFormat(url, "xml");
      if (xmlUrl !== target) return parseXmlResponse(await fetchText(xmlUrl));
    }
    throw new Error("资源站返回的不是有效 JSON/XML");
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
  opts: { level?: number; bindings?: CollectBindings; idOffset?: number } = {},
) {
  const remoteTypeId = num(v.type_id);
  const bound = opts.bindings?.[remoteTypeId];
  const typeId = bound && bound > 0 ? bound : remoteTypeId;
  const remoteVid = num(v.vod_id);
  const vid = remoteVid + (opts.idOffset || 0);
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
    typeId1: typeParent[typeId] || typeId,
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

export async function importTypes(api = LZ_API, format: CollectFormat = "auto") {
  const classes = await fetchRemoteTypes(api, format);
  const parents: Record<number, number> = {};
  for (const c of classes) parents[c.type_id] = SYSTEM_PARENT[c.type_id] ?? c.type_pid ?? 0;
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
    const seo = typeSeoFor(c.type_id, c.type_name);
    await prisma.type.upsert({
      where: { typeId: c.type_id },
      update: {
        typeName: c.type_name,
        typePid: SYSTEM_PARENT[c.type_id] ?? c.type_pid ?? 0,
        typeStatus: 1,
        typeSystem: 1,
        typeMid: 1,
        typeTitle: seo.title,
        typeDes: seo.description,
        typeKey: seo.keywords,
      },
      create: {
        typeId: c.type_id,
        typeName: c.type_name,
        typeEn: `type${c.type_id}`,
        typeSort: c.type_id,
        typeMid: 1,
        typePid: SYSTEM_PARENT[c.type_id] ?? c.type_pid ?? 0,
        typeStatus: 1,
        typeSystem: 1,
        typeTitle: seo.title,
        typeDes: seo.description,
        typeKey: seo.keywords,
        typeTpl: "type.html",
        typeTplList: "show.html",
        typeTplDetail: "detail.html",
        typeTplPlay: "play.html",
        typeTplDown: "down.html",
        typeExtend: extend,
      },
    });
  }
  const newsSeo = typeSeoFor(5, "影视资讯");
  await prisma.type.upsert({
    where: { typeId: 5 },
    update: { typeSystem: 1, typeTitle: newsSeo.title, typeDes: newsSeo.description, typeKey: newsSeo.keywords },
    create: {
      typeId: 5,
      typeName: "影视资讯",
      typeEn: "news",
      typeSort: 5,
      typeMid: 2,
      typePid: 0,
      typeStatus: 1,
      typeSystem: 1,
      typeTitle: newsSeo.title,
      typeDes: newsSeo.description,
      typeKey: newsSeo.keywords,
      typeTpl: "type.html",
      typeTplList: "art/type.html",
      typeTplDetail: "art/detail.html",
      typeExtend: extend,
    },
  });
  await Promise.all([cacheDel(CACHE_KEYS.navTypes), bumpPublicCacheVersion()]);
  return { count: classes.length + 1, parents };
}

export async function collectVods(options: {
  api?: string;
  pages?: number;
  startPage?: number;
  typeId?: number;
  hours?: number;
  format?: CollectFormat;
  limit?: number;
  markLevel?: boolean;
}) {
  const api = options.api || LZ_API;
  const pages = Math.max(1, Math.min(options.pages ?? 2, options.hours ? 100 : 30));
  const startPage = Math.max(1, options.startPage ?? 1);
  const limit = options.limit ?? pages * 20;
  const typeRows = await prisma.type.findMany({ select: { typeId: true, typePid: true } });
  const parent: Record<number, number> = {};
  for (const t of typeRows) parent[t.typeId] = t.typePid;
  const bindings = await getCollectBindings(api);
  const idOffset = sourceIdOffset(api);

  let imported = 0;
  let updated = 0;
  let seen = 0;
  let pagecount = 0;
  const touched: number[] = [];

  outer: for (let page = startPage; page < startPage + pages; page++) {
    if (options.hours && page > startPage) await new Promise((resolve) => setTimeout(resolve, 700));
    const qs = new URLSearchParams({ ac: "detail", pg: String(page) });
    if (options.typeId) qs.set("t", String(options.typeId));
    if (options.hours && options.hours > 0) qs.set("h", String(Math.min(720, Math.floor(options.hours))));
    const data = await lzFetch(`${api}?${qs.toString()}`, options.format || "auto");
    pagecount = data.pagecount || pagecount;
    const list = data.list || [];
    if (!list.length) break;
    for (let i = 0; i < list.length; i++) {
      if (seen >= limit) break outer;
      seen++;
      const mapped = mapLzVod(list[i], parent, {
        level: options.markLevel && seen <= 12 ? 9 : undefined,
        bindings,
        idOffset,
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
      touched.push(mapped.vodId);
    }
  }
  if (touched.length) {
    await syncVodSearchIds(touched).catch(() => {});
    await bumpPublicCacheVersion();
  }
  return { imported, updated, pagecount, total: seen };
}