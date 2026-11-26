import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { LZ_API, fetchRemoteTypes, getCollectBindings, saveCollectBindings } from "@/lib/collect";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const url = new URL(request.url);
  const api = (url.searchParams.get("api") || LZ_API).trim();
  const rawFormat = String(url.searchParams.get("format") || "");
  const format = ["auto", "json", "xml"].includes(rawFormat) ? (rawFormat as "auto" | "json" | "xml") : "auto";
  try {
    const [remoteTypes, localTypes, bindings] = await Promise.all([
      fetchRemoteTypes(api, format),
      prisma.type.findMany({ orderBy: { typeSort: "asc" }, select: { typeId: true, typeName: true, typePid: true, typeMid: true } }),
      getCollectBindings(api),
    ]);
    return NextResponse.json({ code: 1, api, remoteTypes, localTypes, bindings });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "加载资源站分类失败" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { api?: string; bindings?: Record<string, unknown> };
  const api = String(body.api || LZ_API).trim();
  if (!api) return NextResponse.json({ code: 0, msg: "接口地址不能为空" }, { status: 400 });
  const localIds = new Set((await prisma.type.findMany({ select: { typeId: true } })).map((t) => t.typeId));
  const cleaned: Record<number, number> = {};
  for (const [remote, local] of Object.entries(body.bindings || {})) {
    const r = Number(remote);
    const l = Number(local);
    if (Number.isFinite(r) && r > 0 && localIds.has(l)) cleaned[r] = l;
  }
  await saveCollectBindings(api, cleaned);
  return NextResponse.json({ code: 1, msg: `已保存 ${Object.keys(cleaned).length} 条分类绑定`, bindings: cleaned });
}