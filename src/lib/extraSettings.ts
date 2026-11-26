import { headers } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";
import { CACHE_KEYS, bumpPublicCacheVersion, cacheDel, cacheGet, cacheSet } from "./redis";

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
  schedule?: "interval" | "daily" | "weekly";
  time?: string;
  weekdays?: number[];
  sourceId?: number;
  sourceName?: string;
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
  subyun: "速播云播",
  subm3u8: "速播线路",
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
    {
      id: "daily-collect",
      name: "每天采集当天影片",
      action: "collect",
      schedule: "daily",
      time: "06:00",
      weekdays: [],
      intervalMinutes: 1440,
      enabled: 0,
      params: JSON.stringify({ api: "https://lzizy.net/api.php/provide/vod/", pages: 10 }),
      lastRun: 0,
    },
    {
      id: "weekly-collect",
      name: "每周采集本周影片",
      action: "collect",
      schedule: "weekly",
      time: "06:30",
      weekdays: [1],
      intervalMinutes: 10080,
      enabled: 0,
      params: JSON.stringify({ api: "https://lzizy.net/api.php/provide/vod/", pages: 30 }),
      lastRun: 0,
    },
  ],
  urlsend: { baiduToken: "", siteUrl: "", autoPush: 0 },
  domain: { mobileUrl: "", extraDomains: "" },
  captcha: { enabled: 0 },
};

const TASK_NAMES: Record<string, string> = {
  "reset-hits": "重置点击统计",
  "auto-collect": "自动采集最新影片",
  "daily-collect": "每天采集当天影片",
  "weekly-collect": "每周采集本周影片",
};

function looksBroken(value: string) {
  return /�|[?]{2,}/.test(value);
}

function mergeExtra(base: ExtraSettings, patch: Partial<ExtraSettings> | undefined): ExtraSettings {
  if (!patch) return base;
  const ads = { ...base.ads, ...(patch.ads || {}) };
  const players = { ...base.players, ...(patch.players || {}) };
  for (const [key, value] of Object.entries(players)) {
    if (looksBroken(value) && defaultPlayers[key]) players[key] = defaultPlayers[key];
  }
  const timming = (patch.timming ?? base.timming).map((task) =>
    TASK_NAMES[task.id] ? { ...task, name: TASK_NAMES[task.id] } : task,
  );
  return {
    ads,
    safety: { ...base.safety, ...(patch.safety || {}) },
    players,
    timming,
    urlsend: { ...base.urlsend, ...(patch.urlsend || {}) },
    domain: { ...base.domain, ...(patch.domain || {}) },
    captcha: { ...base.captcha, ...(patch.captcha || {}) },
  };
}

async function loadExtra(): Promise<ExtraSettings> {
  const cached = await cacheGet<ExtraSettings>(CACHE_KEYS.extra);
  if (cached?.ads && cached.safety) return cached;
  try {
    const row = await prisma.setting.findUnique({ where: { key: "extra" } });
    const result = row ? mergeExtra(defaultExtra, JSON.parse(row.value) as Partial<ExtraSettings>) : defaultExtra;
    await cacheSet(CACHE_KEYS.extra, result, 3600);
    return result;
  } catch {
    return defaultExtra;
  }
}

export async function markTimingRun(ids: string[], when = Math.floor(Date.now() / 1000)) {
  if (!ids.length) return;
  const row = await prisma.setting.findUnique({ where: { key: "extra" } });
  if (!row) return;
  let data: Partial<ExtraSettings>;
  try {
    data = JSON.parse(row.value) as Partial<ExtraSettings>;
  } catch {
    return;
  }
  const idsSet = new Set(ids);
  const timming = (data.timming || []).map((task) => (idsSet.has(task.id) ? { ...task, lastRun: when } : task));
  data.timming = timming;
  await prisma.setting.upsert({
    where: { key: "extra" },
    update: { value: JSON.stringify(data) },
    create: { key: "extra", value: JSON.stringify(data) },
  });
  await Promise.all([cacheDel(CACHE_KEYS.extra), bumpPublicCacheVersion()]);
}

export const getExtra = cache(loadExtra);

export async function saveExtra(patch: Partial<ExtraSettings>): Promise<ExtraSettings> {
  const current = await getExtra();
  const next = mergeExtra(current, patch);
  await prisma.setting.upsert({
    where: { key: "extra" },
    update: { value: JSON.stringify(next) },
    create: { key: "extra", value: JSON.stringify(next) },
  });
  await Promise.all([cacheDel(CACHE_KEYS.extra), bumpPublicCacheVersion()]);
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
