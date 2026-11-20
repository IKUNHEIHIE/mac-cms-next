import { prisma } from "./db";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function buildRss(limit = 50) {
  const list = await prisma.vod.findMany({ where: { vodStatus: 1 }, orderBy: { vodTime: "desc" }, take: limit });
  const site = await prisma.setting.findUnique({ where: { key: "site" } });
  let siteName = "影视";
  let siteUrl = process.env.SITE_URL || "http://localhost:3000";
  if (site) {
    try {
      const cfg = JSON.parse(site.value);
      siteName = cfg.site_name || siteName;
      if (cfg.site_url && /^https?:\/\//.test(cfg.site_url)) siteUrl = cfg.site_url;
    } catch {}
  }
  const items = list
    .map(
      (v) => `    <item>
      <title>${esc(v.vodName)}</title>
      <link>${siteUrl}/vod/detail/${v.vodId}</link>
      <guid>${siteUrl}/vod/detail/${v.vodId}</guid>
      <description>${esc(v.vodBlurb || v.vodContent?.slice(0, 100) || "")}</description>
      <pubDate>${new Date(v.vodTime * 1000).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${esc(siteName)} - 最新影视更新</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>`;
}

export function rssResponse(xml: string) {
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}