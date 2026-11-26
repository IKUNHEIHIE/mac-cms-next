import { cache } from "react";
import { prisma } from "./db";
import { CACHE_KEYS, bumpPublicCacheVersion, cacheDel, cacheGet, cacheSet } from "./redis";
import { ADMIN_PATH_DEFAULT, normalizeAdminPath } from "./adminPath";

export type SiteConfig = {
  site_name: string;
  site_url: string;
  site_keywords: string;
  site_description: string;
  site_email: string;
  site_qq: string;
  site_icp: string;
  site_tj: string;
  search_hot: string;
  site_status: number;
  comment_status: number;
  gbook_status: number;
  user_status: number;
  copyright_status: number;
  copyright_notice: string;
  adminPath: string;
};

export type ThemeConfig = {
  name: string;
  logoB: string;
  logoW: string;
  banner: number;
  bannerMode: "small" | "big";
  hotTitle: string;
  hotNum: number;
  homeNum: number;
  navIds: number[];
  menuIds: number[];
  categoryHomeIds: number[];
  zbTypeId: number;
  hbTypeIds: number[];
  articleTypeId: number;
  playlink: number;
  playAd: number;
  comments: number;
  color: "default" | "green" | "blue" | "pink" | "red" | "gold";
  darkMode: boolean;
  footText: string;
  notice: string;
  kfQq: string;
};

export type Settings = { site: SiteConfig; theme: ThemeConfig };

export const defaultSettings: Settings = {
  site: {
    site_name: "影视",
    site_url: "http://localhost:3000",
    site_keywords: "影视,电影,电视剧,综艺,动漫,在线观看",
    site_description: "提供最新最快的影视资源在线观看",
    site_email: "admin@example.com",
    site_qq: "123456",
    site_icp: "",
    site_tj: "",
    search_hot: "黄蜂,好搭档,黑帮恋事多,热播剧,动漫",
    site_status: 1,
    comment_status: 1,
    gbook_status: 1,
    user_status: 1,
    copyright_status: 0,
    copyright_notice: "该视频由于版权限制，暂不提供播放。",
    adminPath: ADMIN_PATH_DEFAULT,
  },
  theme: {
    name: "conch",
    logoB: "/theme/conch/asset/img/logo_black.png",
    logoW: "/theme/conch/asset/img/logo_white.png",
    banner: 1,
    bannerMode: "small",
    hotTitle: "热播推荐",
    hotNum: 12,
    homeNum: 12,
    navIds: [1, 2, 3, 4, 36],
    menuIds: [1, 2, 3, 4, 46],
    categoryHomeIds: [1, 2, 3, 4],
    zbTypeId: 0,
    hbTypeIds: [],
    articleTypeId: 5,
    playlink: 0,
    playAd: 1,
    comments: 1,
    color: "default",
    darkMode: false,
    footText: "本站所有资源均收集于互联网，仅供学习交流使用。",
    notice: "欢迎访问本站，资源每日更新，请收藏本站域名。",
    kfQq: "",
  },
};

function merge<T extends object>(base: T, patch: Partial<T> | undefined): T {
  return { ...base, ...(patch || {}) };
}

async function loadSettings(): Promise<Settings> {
  const cached = await cacheGet<Settings>(CACHE_KEYS.settings);
  if (cached?.site && cached.theme) {
    const result = { site: merge(defaultSettings.site, cached.site), theme: merge(defaultSettings.theme, cached.theme) };
    result.site.adminPath = normalizeAdminPath(result.site.adminPath);
    return result;
  }
  try {
    const rows = await prisma.setting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const site = map.get("site") ? JSON.parse(map.get("site")!) : undefined;
    const theme = map.get("theme") ? JSON.parse(map.get("theme")!) : undefined;
    const result = { site: merge(defaultSettings.site, site), theme: merge(defaultSettings.theme, theme) };
    result.site.adminPath = normalizeAdminPath(result.site.adminPath);
    await Promise.all([
      cacheSet(CACHE_KEYS.settings, result, 3600),
      cacheSet(CACHE_KEYS.adminPath, result.site.adminPath, 31536000),
    ]);
    return result;
  } catch {
    return defaultSettings;
  }
}

export const getSettings = cache(loadSettings);

export async function saveSetting(key: "site" | "theme", value: Record<string, unknown>) {
  const current = await getSettings();
  const next = merge(key === "site" ? current.site : current.theme, value as never);
  if (key === "site") (next as SiteConfig).adminPath = normalizeAdminPath((next as SiteConfig).adminPath);
  const adminPath = key === "site" ? (next as SiteConfig).adminPath : current.site.adminPath;
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(next) },
    create: { key, value: JSON.stringify(next) },
  });
  await Promise.all([
    cacheDel(CACHE_KEYS.settings, CACHE_KEYS.navTypes),
    cacheSet(CACHE_KEYS.adminPath, adminPath, 31536000),
    bumpPublicCacheVersion(),
  ]);
  return next;
}