export type VodLike = {
  vodId: number;
  vodName: string;
  vodPlayFrom?: string | null;
  vodPlayUrl?: string | null;
  vodPic?: string | null;
  vodPicSlide?: string | null;
  vodRemarks?: string | null;
  vodSerial?: string | null;
  vodScore?: number | null;
  vodYear?: string | null;
  vodArea?: string | null;
  vodClass?: string | null;
};

export type PlaySource = {
  sid: number;
  from: string;
  show: string;
  urls: { nid: number; name: string; url: string }[];
};

const PLAYER_LABELS: Record<string, string> = {
  liangzi: "量子资源",
  lzm3u8: "LZ线路",
  lzyun: "LZ云播",
  ckm3u8: "CK线路",
  ffm3u8: "FF线路",
  tkm3u8: "TK线路",
  wjm3u8: "WJ线路",
  bfzym3u8: "暴风资源",
  hnzym3u8: "红牛资源",
  kuaikan: "快看资源",
  dbm3u8: "豆瓣资源",
  snm3u8: "索尼资源",
  hnm3u8: "红牛线路",
  zuidam3u8: "最大资源",
};

export function playerLabel(from: string, labels?: Record<string, string>) {
  return labels?.[from] || PLAYER_LABELS[from] || from;
}

export function parsePlaySources(
  vod: Pick<VodLike, "vodPlayFrom" | "vodPlayUrl">,
  labels?: Record<string, string>,
): PlaySource[] {
  const froms = (vod.vodPlayFrom || "").split("$$$").filter(Boolean);
  const groups = (vod.vodPlayUrl || "").split("$$$");
  return froms
    .map((from, sidx) => {
      const raw = groups[sidx] || "";
      const urls = raw
        .split("#")
        .map((ep) => ep.trim())
        .filter(Boolean)
        .map((ep, nidx) => {
          const idx = ep.indexOf("$");
          const name = idx >= 0 ? ep.slice(0, idx) : `第${nidx + 1}集`;
          const url = idx >= 0 ? ep.slice(idx + 1) : ep;
          return { nid: nidx + 1, name, url };
        });
      return { sid: sidx + 1, from, show: playerLabel(from, labels), urls };
    })
    .filter((s) => s.urls.length > 0);
}

export function vodPlayLink(vod: Pick<VodLike, "vodId" | "vodPlayFrom" | "vodPlayUrl">) {
  const sources = parsePlaySources(vod);
  const media = sources.find((s) => s.urls.some((u) => /\.(m3u8|mp4)(\?|$)/i.test(u.url)));
  const sid = (media || sources[0])?.sid || 1;
  return `/vod/play/${vod.vodId}/${sid}/1`;
}

export function vodDetailLink(vod: Pick<VodLike, "vodId">) {
  return `/vod/detail/${vod.vodId}`;
}

export function vodLink(vod: VodLike, playlink = 0) {
  return playlink ? vodPlayLink(vod) : vodDetailLink(vod);
}

export function vodSubline(vod: {
  vodRemarks?: string | null;
  vodSerial?: string | null;
  vodScore?: number | null;
  vodYear?: string | null;
}) {
  if (vod.vodRemarks) return vod.vodRemarks;
  if (vod.vodSerial && Number(vod.vodSerial) > 0) return `第${vod.vodSerial}集`;
  if (vod.vodScore && vod.vodScore > 0) return String(vod.vodScore);
  return "已完结";
}

export function fmtTime(ts: number, withTime = false) {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime ? `${day} ${pad(d.getHours())}:${pad(d.getMinutes())}` : day;
}

export function fmtHits(n: number) {
  if (!n) return "0";
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}

export function toTime(value: string | null | undefined): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

export function stripTags(html: string) {
  return (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function typeVodLink(typeId: number, by = "time", extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ by, ...extra });
  return `/vod/type/${typeId}?${params.toString()}`;
}

export function poster(url: string | null | undefined) {
  return url && url.trim() ? url : "/theme/conch/asset/img/nopic.png";
}