import { cache } from "react";
import { prisma } from "./db";
import { getSettings, type Settings } from "./settings";
import { CACHE_KEYS, cacheGet, cacheSet } from "./redis";

export type SiteType = {
  typeId: number;
  typeName: string;
  typeEn: string;
  typePid: number;
  typeMid: number;
  typeExtend: string | null;
};

async function loadSiteContext(): Promise<{
  settings: Settings;
  types: SiteType[];
  navTypes: SiteType[];
}> {
  const settings = await getSettings();
  let types = await cacheGet<SiteType[]>(CACHE_KEYS.navTypes);
  if (!types) {
    types = await prisma.type.findMany({
      where: { typeStatus: 1, typeMid: 1, typePid: 0 },
      orderBy: { typeSort: "asc" },
      select: { typeId: true, typeName: true, typeEn: true, typePid: true, typeMid: true, typeExtend: true },
    });
    await cacheSet(CACHE_KEYS.navTypes, types, 3600);
  }
  const ids = settings.theme.navIds || [];
  const picked = ids.length ? ids.map((id) => types.find((t) => t.typeId === id)).filter(Boolean) : [];
  const navTypes = (picked.length ? picked : types.slice(0, 7)) as SiteType[];
  return { settings, types, navTypes };
}

export const getSiteContext = cache(loadSiteContext);

export function typeFilters(typeExtend: string | null): { class: string[]; area: string[]; year: string[]; lang: string[] } {
  try {
    const o = JSON.parse(typeExtend || "{}");
    const toArr = (v: unknown) =>
      Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split(",") : [];
    return { class: toArr(o.class), area: toArr(o.area), year: toArr(o.year), lang: toArr(o.lang) };
  } catch {
    return { class: [], area: [], year: [], lang: [] };
  }
}

export function pageParam(raw: string | string[] | undefined, fallback = 1) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}