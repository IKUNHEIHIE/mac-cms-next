import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { saveExtra, type AdsConfig, type SafetyConfig, type TimingTask } from "@/lib/extraSettings";

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (body.ads && typeof body.ads === "object") patch.ads = body.ads as AdsConfig;
  if (body.safety && typeof body.safety === "object") patch.safety = body.safety as SafetyConfig;
  if (body.players && typeof body.players === "object" && !Array.isArray(body.players)) {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.players as Record<string, unknown>)) {
      if (/^[\w-]{1,30}$/.test(k)) cleaned[k] = String(v).slice(0, 40);
    }
    patch.players = cleaned;
  }
  if (body.timming && Array.isArray(body.timming)) {
    const tasks = (body.timming as unknown[])
      .filter((t): t is TimingTask => Boolean(t && typeof t === "object" && "id" in (t as object) && "action" in (t as object)))
      .slice(0, 30)
      .map((t) => ({
        id: String(t.id).slice(0, 40),
        name: String(t.name || t.id).slice(0, 60),
        action: ["collect", "revalidate", "resetHits"].includes(t.action) ? t.action : "revalidate",
        intervalMinutes: Math.max(1, Number(t.intervalMinutes) || 60),
        enabled: t.enabled ? 1 : 0,
        params: String(t.params || "").slice(0, 2000),
        lastRun: Number(t.lastRun) || 0,
      }));
    patch.timming = tasks;
  }
  if (body.urlsend && typeof body.urlsend === "object") patch.urlsend = body.urlsend;
  if (body.domain && typeof body.domain === "object") patch.domain = body.domain;
  if (body.captcha && typeof body.captcha === "object") patch.captcha = { enabled: (body.captcha as { enabled?: number }).enabled ? 1 : 0 };
  if (Object.keys(patch).length === 0) return NextResponse.json({ code: 0, msg: "没有可保存的配置" }, { status: 400 });
  const extra = await saveExtra(patch as never);
  return NextResponse.json({ code: 1, msg: "保存成功", extra });
}

export const dynamic = "force-dynamic";