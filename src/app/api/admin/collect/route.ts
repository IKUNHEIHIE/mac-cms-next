import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { collectVods, importTypes, LZ_API } from "@/lib/collect";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const api = String(b.api || LZ_API).trim();
  if (!/^https?:\/\//i.test(api)) return NextResponse.json({ code: 0, msg: "接口地址无效" }, { status: 400 });
  try {
    if (b.action === "types") {
      const r = await importTypes(api);
      return NextResponse.json({ code: 1, msg: `分类导入完成，共 ${r.count} 个分类` });
    }
    const pages = Math.max(1, Math.min(30, Number(b.pages) || 3));
    const startPage = Math.max(1, Number(b.startPage) || 1);
    const r = await collectVods({
      api,
      pages,
      startPage,
      typeId: b.typeId ? Number(b.typeId) : undefined,
      markLevel: Boolean(b.markLevel),
    });
    return NextResponse.json({
      code: 1,
      msg: `采集完成：新增 ${r.imported} 部，更新 ${r.updated} 部，处理 ${r.total} 条`,
    });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "采集失败" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";