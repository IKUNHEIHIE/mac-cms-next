import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const { id } = await params;
  const annexId = Number(id);
  if (!annexId) return NextResponse.json({ code: 0, msg: "参数错误" }, { status: 400 });
  const annex = await prisma.annex.findUnique({ where: { annexId } });
  if (!annex) return NextResponse.json({ code: 0, msg: "文件不存在" }, { status: 404 });
  await prisma.annex.delete({ where: { annexId } });
  const prefix = annex.annexFile.startsWith("/media/") ? "/media/" : annex.annexFile.startsWith("/uploads/") ? "/uploads/" : "";
  if (prefix) {
    const base = path.join(process.cwd(), "public", "uploads");
    const abs = path.join(base, annex.annexFile.slice(prefix.length));
    if (abs.startsWith(base)) await unlink(abs).catch(() => {});
  }
  return NextResponse.json({ code: 1, msg: "已删除" });
}

export const dynamic = "force-dynamic";