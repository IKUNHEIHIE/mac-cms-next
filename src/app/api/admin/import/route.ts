import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";

export const maxDuration = 300;

const MODELS = [
  "type",
  "group",
  "actor",
  "role",
  "topic",
  "manga",
  "website",
  "vod",
  "art",
  "user",
  "order",
  "card",
  "cash",
  "plog",
  "comment",
  "gbook",
  "link",
  "collect",
  "msg",
  "annex",
  "visit",
  "ulog",
  "cjNode",
  "admin",
  "setting",
];

function fieldsOf(model: string) {
  const pascal = model.charAt(0).toUpperCase() + model.slice(1);
  const meta = Prisma.dmmf.datamodel.models.find(
    (m) => m.name === pascal || m.name.toLowerCase() === model.toLowerCase(),
  );
  return new Set((meta?.fields || []).filter((f) => f.kind === "scalar").map((f) => f.name));
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { tables?: Record<string, unknown[]> } | null;
  const tables = body?.tables;
  if (!tables || typeof tables !== "object") {
    return NextResponse.json({ code: 0, msg: "备份文件格式不正确" }, { status: 400 });
  }
  const db = prisma as unknown as Record<string, { deleteMany: () => unknown; createMany: (a: unknown) => unknown }>;
  const ops: unknown[] = [];
  const counts: Record<string, number> = {};

  for (const model of MODELS) {
    const rows = tables[model];
    if (!Array.isArray(rows)) continue;
    const allowed = fieldsOf(model);
    const cleaned = rows
      .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
      .map((r) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) if (allowed.has(k)) out[k] = v;
        return out;
      })
      .filter((r) => Object.keys(r).length > 0);
    if (!db[model]) continue;
    if (rows.length > 0 && cleaned.length === 0) {
      return NextResponse.json({ code: 0, msg: `表 ${model} 的字段与当前结构不匹配，已取消导入` }, { status: 400 });
    }
    if (cleaned.length === 0) continue;
    ops.push(db[model].deleteMany());
    for (let i = 0; i < cleaned.length; i += 200) {
      ops.push(db[model].createMany({ data: cleaned.slice(i, i + 200) }));
    }
    counts[model] = cleaned.length;
  }
  if (ops.length === 0) return NextResponse.json({ code: 0, msg: "备份中没有可导入的数据" }, { status: 400 });
  try {
    await prisma.$transaction(ops as never[]);
    return NextResponse.json({ code: 1, msg: "导入完成", counts });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "导入失败" }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";