import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { LZ_API, fetchRemoteTypes, getCollectBindings, saveCollectBindings, type CollectFormat } from "@/lib/collect";
import { smartBind } from "@/lib/collectMatch";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { api?: string; format?: string };
  const api = String(body.api || LZ_API).trim();
  if (!/^https?:\/\//i.test(api)) return NextResponse.json({ code: 0, msg: "接口地址无效" }, { status: 400 });
  const format: CollectFormat = ["auto", "json", "xml"].includes(String(body.format || ""))
    ? (body.format as CollectFormat)
    : "auto";
  try {
    const [remoteTypes, localTypes, existing] = await Promise.all([
      fetchRemoteTypes(api, format),
      prisma.type.findMany({
        orderBy: { typeSort: "asc" },
        select: { typeId: true, typeName: true, typePid: true, typeMid: true },
      }),
      getCollectBindings(api),
    ]);
    const result = smartBind(remoteTypes, localTypes, existing);
    await saveCollectBindings(api, result.bindings);
    return NextResponse.json({
      code: 1,
      msg: `智能绑定完成：匹配 ${result.matched.length} 个，未匹配 ${result.unmatched.length} 个`,
      bindings: result.bindings,
      matched: result.matched,
      unmatched: result.unmatched,
    });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "智能绑定失败" }, { status: 502 });
  }
}
