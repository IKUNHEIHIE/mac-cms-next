import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "webm", "m3u8"]);

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ code: 0, msg: "请选择文件" }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ code: 0, msg: "文件不能超过 50MB" }, { status: 400 });
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED.has(ext)) return NextResponse.json({ code: 0, msg: "不支持的文件类型" }, { status: 400 });
  const now = new Date();
  const sub = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(process.cwd(), "public", "uploads", sub);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  const url = `/media/${sub}/${name}`;
  await prisma.annex.create({
    data: { annexTime: Math.floor(Date.now() / 1000), annexFile: url, annexSize: file.size, annexType: ext },
  });
  return NextResponse.json({ code: 1, msg: "上传成功", url });
}