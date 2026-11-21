import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { safeFetch } from "@/lib/net";

export const maxDuration = 300;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function strip(html: string) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

function extract(regex: string | null | undefined, html: string) {
  if (!regex) return "";
  try {
    const m = html.match(new RegExp(regex, "i"));
    return m ? (m[1] ?? m[0]) : "";
  } catch {
    return "";
  }
}

async function fetchHtml(url: string) {
  const res = await safeFetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return text.slice(0, 5 * 1024 * 1024);
}

function listUrls(node: { urlpage: string | null; pagesizeStart: number; pagesizeEnd: number; urlContain: string | null; urlExcept: string | null }) {
  const lines = (node.urlpage || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const start = Math.max(1, node.pagesizeStart || 1);
  const end = Math.max(start, Math.min(30, node.pagesizeEnd || start));
  const urls: string[] = [];
  for (const line of lines) {
    if (line.includes("(*)")) {
      for (let p = start; p <= end; p++) urls.push(line.replace(/\(\*\)/g, String(p)));
    } else {
      urls.push(line);
    }
  }
  return urls.slice(0, 20);
}

function filterLinks(html: string, base: string, contain: string, except: string) {
  const out = new Set<string>();
  const re = /<a[^>]+href=["']([^"'#]+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let abs = "";
    try {
      abs = new URL(decode(m[1]), base).toString();
    } catch {
      continue;
    }
    if (contain && !abs.includes(contain)) continue;
    if (except && except.split("|").some((s) => s && abs.includes(s))) continue;
    if (!/^https?:/i.test(abs)) continue;
    out.add(abs);
  }
  return [...out];
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { nodeid?: number };
  const nodeid = Number(body.nodeid);
  const node = nodeid ? await prisma.cjNode.findUnique({ where: { nodeid } }) : null;
  if (!node) return NextResponse.json({ code: 0, msg: "采集节点不存在" }, { status: 404 });
  if (!node.urlpage) return NextResponse.json({ code: 0, msg: "请先在节点中配置列表页地址" }, { status: 400 });

  const stats = { pages: 0, links: 0, saved: 0, skipped: 0, failed: 0 };
  const allLinks = new Set<string>();
  try {
    for (const listUrl of listUrls(node)) {
      try {
        const html = await fetchHtml(listUrl);
        stats.pages++;
        for (const u of filterLinks(html, listUrl, node.urlContain || "", node.urlExcept || "")) allLinks.add(u);
      } catch {
        stats.failed++;
      }
    }
    stats.links = allLinks.size;
    const articleType = await prisma.type.findFirst({ where: { typeMid: 2, typeStatus: 1 }, orderBy: { typeSort: "asc" } });
    const typeId = articleType?.typeId || 5;

    for (const url of [...allLinks].slice(0, 30)) {
      const md5 = createHash("md5").update(url).digest("hex");
      const seen = await prisma.cjHistory.findUnique({ where: { md5 } });
      if (seen) {
        stats.skipped++;
        continue;
      }
      try {
        const html = await fetchHtml(url);
        const title = strip(extract(node.titleRule || "<title>([^<]+)</title>", html)) || strip(extract("<title>([^<]+)</title>", html));
        if (!title) {
          stats.failed++;
          continue;
        }
        const content = extract(node.contentRule || "<article[^>]*>([\\s\\S]*?)</article>", html);
        const contentHtml = content || extract("<body[^>]*>([\\s\\S]*?)</body>", html);
        const pic = extract("<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)", html);
        const exists = await prisma.art.findFirst({ where: { artName: title }, select: { artId: true } });
        if (exists) {
          stats.skipped++;
          await prisma.cjHistory.create({ data: { md5 } }).catch(() => {});
          continue;
        }
        const now = Math.floor(Date.now() / 1000);
        await prisma.art.create({
          data: {
            typeId,
            artName: title.slice(0, 255),
            artSub: title.slice(0, 255),
            artEn: `cj-${md5.slice(0, 12)}`,
            artStatus: 1,
            artFrom: new URL(url).host,
            artAuthor: "采集",
            artPic: pic ? new URL(pic, url).toString() : "",
            artBlurb: strip(contentHtml).slice(0, 250),
            artRemarks: "采集",
            artLevel: 0,
            artHits: 0,
            artTime: now,
            artTimeAdd: now,
            artContent: contentHtml.slice(0, 100000),
          },
        });
        await prisma.cjHistory.create({ data: { md5 } }).catch(() => {});
        stats.saved++;
      } catch {
        stats.failed++;
      }
    }
    await prisma.cjNode.update({ where: { nodeid }, data: { lastdate: Math.floor(Date.now() / 1000) } });
    return NextResponse.json({
      code: 1,
      msg: `采集完成：列表页 ${stats.pages}，发现链接 ${stats.links}，入库 ${stats.saved}，跳过 ${stats.skipped}，失败 ${stats.failed}`,
      stats,
    });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "采集失败" }, { status: 500 });
  }
}