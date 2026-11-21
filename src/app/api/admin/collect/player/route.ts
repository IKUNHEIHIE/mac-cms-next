import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { safeFetch } from "@/lib/net";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["html", "htm", "js"]);

async function suggestFrom(api: string) {
  if (!api) return "";
  const url = `${api}${api.includes("?") ? "&" : "?"}ac=detail&pg=1`;
  const res = await safeFetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { list?: Record<string, string>[] };
  const set = new Set<string>();
  for (const v of data.list || []) {
    for (const f of String(v.vod_play_from || "").split("$$$")) if (f.trim()) set.add(f.trim());
  }
  return [...set].join(",");
}

async function nodeById(id: number) {
  return prisma.collect.findUnique({ where: { collectId: id } });
}

async function removeOldFile(file: string) {
  if (!file.startsWith("/media/players/")) return;
  const base = path.join(process.cwd(), "public", "uploads", "players");
  const abs = path.join(base, file.slice("/media/players/".length));
  if (abs.startsWith(base)) await unlink(abs).catch(() => {});
}

export async function GET(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const nodeId = Number(new URL(request.url).searchParams.get("nodeId"));
  const node = nodeId ? await nodeById(nodeId) : null;
  if (!node) return NextResponse.json({ code: 0, msg: "采集节点不存在" }, { status: 404 });
  let suggestedFrom = node.collectPlayerFrom;
  try {
    suggestedFrom = (await suggestFrom(node.collectUrl)) || suggestedFrom;
  } catch {}
  return NextResponse.json({
    code: 1,
    suggestedFrom,
    player: {
      name: node.collectPlayerName,
      from: node.collectPlayerFrom,
      file: node.collectPlayerFile,
      type: node.collectPlayerType,
      status: node.collectPlayerStatus,
    },
  });
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const nodeId = Number(form?.get("nodeId"));
  const node = nodeId ? await nodeById(nodeId) : null;
  if (!node) return NextResponse.json({ code: 0, msg: "采集节点不存在" }, { status: 404 });
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ code: 0, msg: "请选择播放器文件" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ code: 0, msg: "播放器文件不能超过 10MB" }, { status: 400 });
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED.has(ext)) return NextResponse.json({ code: 0, msg: "仅支持 .html / .htm / .js 播放器文件" }, { status: 400 });

  let fromCodes = String(form?.get("fromCodes") || "").trim();
  if (!fromCodes) {
    try {
      fromCodes = await suggestFrom(node.collectUrl);
    } catch {}
  }
  fromCodes = fromCodes
    .split(",")
    .map((v) => v.replace(/[^A-Za-z0-9_-]/g, "").trim())
    .filter(Boolean)
    .join(",")
    .slice(0, 255);
  const name = String(form?.get("name") || file.name).replace(/[<\r\n]/g, "").trim().slice(0, 60);
  const dir = path.join(process.cwd(), "public", "uploads", "players");
  await mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));
  const url = `/media/players/${fileName}`;
  await removeOldFile(node.collectPlayerFile);
  await prisma.collect.update({
    where: { collectId: nodeId },
    data: {
      collectPlayerName: name,
      collectPlayerFrom: fromCodes,
      collectPlayerFile: url,
      collectPlayerType: ext === "js" ? "js" : "html",
      collectPlayerStatus: 1,
    },
  });
  return NextResponse.json({ code: 1, msg: "播放器已上传并绑定到该节点", url, fromCodes });
}

export async function DELETE(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const nodeId = Number(new URL(request.url).searchParams.get("nodeId"));
  const node = nodeId ? await nodeById(nodeId) : null;
  if (!node) return NextResponse.json({ code: 0, msg: "采集节点不存在" }, { status: 404 });
  await removeOldFile(node.collectPlayerFile);
  await prisma.collect.update({
    where: { collectId: nodeId },
    data: {
      collectPlayerName: "",
      collectPlayerFrom: "",
      collectPlayerFile: "",
      collectPlayerType: "",
      collectPlayerStatus: 0,
    },
  });
  return NextResponse.json({ code: 1, msg: "已移除该节点的播放器" });
}