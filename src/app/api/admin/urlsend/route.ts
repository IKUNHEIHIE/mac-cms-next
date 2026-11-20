import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { getExtra } from "@/lib/extraSettings";
import { getSettings } from "@/lib/settings";

export const maxDuration = 60;

function normalizeSite(raw: string) {
  const s = raw.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { token?: string; siteUrl?: string };
  const [extra, settings] = await Promise.all([getExtra(), getSettings()]);
  const token = String(body.token || extra.urlsend.baiduToken || "").trim();
  const rawSite = String(body.siteUrl || extra.urlsend.siteUrl || settings.site.site_url || "").trim();
  if (!token) return NextResponse.json({ code: 0, msg: "请先配置百度推送 Token" }, { status: 400 });
  const site = normalizeSite(rawSite);
  let host = "";
  try {
    host = new URL(site).host;
  } catch {
    return NextResponse.json({ code: 0, msg: "站点地址无效" }, { status: 400 });
  }
  const vods = await prisma.vod.findMany({ orderBy: { vodTime: "desc" }, take: 20, select: { vodId: true } });
  const urls = vods.map((v) => `${site.replace(/\/$/, "")}/vod/detail/${v.vodId}`);
  try {
    const res = await fetch(`https://data.zz.baidu.com/urls?site=${encodeURIComponent(host)}&token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: urls.join("\n"),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    return NextResponse.json({
      code: res.ok ? 1 : 0,
      msg: res.ok ? `已推送 ${urls.length} 条 URL` : `百度接口返回 HTTP ${res.status}`,
      result: text.slice(0, 1000),
    });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "推送失败" }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";