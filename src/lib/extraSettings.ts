import { headers } from "next/headers";
import { prisma } from "./db";

export type AdSlotConfig = {
  enabled: number;
  title: string;
  sub: string;
  pic: string;
  link: string;
  text: string;
};

export type AdsConfig = {
  home: AdSlotConfig;
  list: AdSlotConfig;
  search: AdSlotConfig;
  detailRight: AdSlotConfig;
  playBottom: AdSlotConfig;
};

export type SafetyConfig = {
  ipBlacklist: string;
  notice: string;
};

export type TimingTask = {
  id: string;
  name: string;
  action: "collect" | "revalidate" | "resetHits";
  intervalMinutes: number;
  enabled: number;
  params: string;
  lastRun: number;
};

export type ExtraSettings = {
  ads: AdsConfig;
  safety: SafetyConfig;
  players: Record<string, string>;
  timming: TimingTask[];
  urlsend: { baiduToken: string; siteUrl: string; autoPush: number };
  domain: { mobileUrl: string; extraDomains: string };
  captcha: { enabled: number };
};

const ad = (): AdSlotConfig => ({ enabled: 0, title: "", sub: "", pic: "", link: "", text: "" });

export const defaultPlayers: Record<string, string> = {
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

const defaultExtra: ExtraSettings = {
  ads: { home: ad(), list: ad(), search: ad(), detailRight: ad(), playBottom: ad() },
  safety: { ipBlacklist: "", notice: "" },
  players: defaultPlayers,
  timming: [
    {
      id: "reset-hits",
      name: "重置点击统计",
      action: "resetHits",
      intervalMinutes: 1440,
      enabled: 0,
      params: "",
      lastRun: 0,
    },
    {
      id: "auto-collect",
      name: "自动采集最新影片",
      action: "collect",
      intervalMinutes: 360,
      enabled: 0,
      params: JSON.stringify({ api: "https://lzizy.net/api.php/provide/vod/", pages: 1 }),
      lastRun: 0,
    },
  ],
  urlsend: { baiduToken: "", siteUrl: "", autoPush: 0 },
  domain: { mobileUrl: "", extraDomains: "" },
  captcha: { enabled: 0 },
};

function mergeExtra(base: ExtraSettings, patch: Partial<ExtraSettings> | undefined): ExtraSettings {
  if (!patch) return base;
  const ads = { ...base.ads, ...(patch.ads || {}) };
  return {
    ads,
    safety: { ...base.safety, ...(patch.safety || {}) },
    players: { ...base.players, ...(patch.players || {}) },
    timming: patch.timming ?? base.timming,
    urlsend: { ...base.urlsend, ...(patch.urlsend || {}) },
    domain: { ...base.domain, ...(patch.domain || {}) },
    captcha: { ...base.captcha, ...(patch.captcha || {}) },
  };
}

export async function getExtra(): Promise<ExtraSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "extra" } });
    if (!row) return defaultExtra;
    return mergeExtra(defaultExtra, JSON.parse(row.value) as Partial<ExtraSettings>);
  } catch {
    return defaultExtra;
  }
}

export async function saveExtra(patch: Partial<ExtraSettings>): Promise<ExtraSettings> {
  const current = await getExtra();
  const next = mergeExtra(current, patch);
  await prisma.setting.upsert({
    where: { key: "extra" },
    update: { value: JSON.stringify(next) },
    create: { key: "extra", value: JSON.stringify(next) },
  });
  return next;
}

export async function requestIp() {
  const h = await headers();
  const raw = h.get("x-forwarded-for") || h.get("x-real-ip") || "";
  return raw.split(",")[0].trim() || "127.0.0.1";
}

export function ipMatches(ip: string, blacklist: string) {
  if (!blacklist.trim()) return false;
  const list = blacklist.split(/[\s,;，；]+/).map((s) => s.trim()).filter(Boolean);
  return list.some((rule) => {
    if (rule.endsWith("*")) return ip.startsWith(rule.slice(0, -1));
    return ip === rule;
  });
}

export async function isRequestBlocked() {
  const extra = await getExtra();
  if (!extra.safety.ipBlacklist) return false;
  const ip = await requestIp();
  return ipMatches(ip, extra.safety.ipBlacklist);
}
export function ipFromRequest(request: Request) {
  const raw = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  return raw.split(",")[0].trim() || "127.0.0.1";
}

export async function isBlockedRequest(request: Request) {
  const extra = await getExtra();
  if (!extra.safety.ipBlacklist) return false;
  return ipMatches(ipFromRequest(request), extra.safety.ipBlacklist);
}
