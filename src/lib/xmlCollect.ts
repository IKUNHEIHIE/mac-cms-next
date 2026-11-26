import { XMLParser } from "fast-xml-parser";

export type LzClass = { type_id: number; type_pid: number; type_name: string };
export type LzVod = Record<string, string | number | undefined>;
export type LzResponse = {
  code?: number;
  msg?: string;
  page?: number;
  pagecount?: number;
  total?: number;
  list?: LzVod[];
  class?: LzClass[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  trimValues: false,
  processEntities: false,
  parseTagValue: false,
  parseAttributeValue: false,
});

function decode(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function text(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return decode(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const parts: string[] = [];
    if (obj["#cdata"] !== undefined) parts.push(text(obj["#cdata"]));
    if (obj["#text"] !== undefined) parts.push(text(obj["#text"]));
    return parts.join("");
  }
  return "";
}

function array<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function attr(value: unknown, key: string): string {
  if (!value || typeof value !== "object") return "";
  return text((value as Record<string, unknown>)[`@_${key}`]);
}

function first(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseXmlResponse(body: string): LzResponse {
  const doc = parser.parse(body) as Record<string, unknown>;
  const rss = (doc.rss || doc) as Record<string, unknown>;
  const listNode = first(rss.list) as Record<string, unknown> | undefined;
  if (!listNode || typeof listNode !== "object") throw new Error("XML 中缺少 list");
  const videos = array((listNode as Record<string, unknown>).video) as Record<string, unknown>[];
  const list: LzVod[] = videos.map((v) => {
    const dl = first(v.dl) as Record<string, unknown> | undefined;
    const dds = array(dl?.dd) as Record<string, unknown>[];
    const froms = dds.map((dd) => attr(dd, "flag"));
    const urls = dds.map((dd) => text(dd));
    return {
      vod_id: text(v.id),
      type_id: text(v.tid),
      type_name: text(v.type),
      vod_name: text(v.name),
      vod_sub: text(v.subname),
      vod_remarks: text(v.note),
      vod_pic: text(v.pic),
      vod_lang: text(v.lang),
      vod_area: text(v.area),
      vod_year: text(v.year),
      vod_serial: text(v.state),
      vod_actor: text(v.actor),
      vod_director: text(v.director),
      vod_content: text(v.des),
      vod_time: text(v.last),
      vod_play_from: froms.filter(Boolean).join("$$$"),
      vod_play_url: urls.filter(Boolean).join("$$$"),
      vod_play_note: "",
      vod_isend: text(v.state) ? 0 : 1,
    };
  });
  const classNode = first(rss.class) as Record<string, unknown> | undefined;
  const classes = array(classNode?.ty) as Record<string, unknown>[];
  return {
    code: 1,
    msg: "xml",
    page: Number(attr(listNode, "page")) || 1,
    pagecount: Number(attr(listNode, "pagecount")) || 0,
    total: Number(attr(listNode, "recordcount")) || 0,
    list,
    class: classes.map((ty) => ({
      type_id: Number(attr(ty, "id")) || 0,
      type_pid: 0,
      type_name: text(ty),
    })),
  };
}
