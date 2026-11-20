import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";
import { getResource, defaultOrder, type ResourceDef } from "@/lib/adminResources";

export const dynamic = "force-dynamic";

function delegate(model: string) {
  return (prisma as unknown as Record<string, unknown>)[model] as {
    findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
    count: (args: unknown) => Promise<number>;
    create: (args: unknown) => Promise<Record<string, unknown>>;
    update: (args: unknown) => Promise<Record<string, unknown>>;
    delete: (args: unknown) => Promise<Record<string, unknown>>;
    findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  };
}

function intFields(model: string) {
  const pascal = model.charAt(0).toUpperCase() + model.slice(1);
  const meta = Prisma.dmmf.datamodel.models.find(
    (m) => m.name === pascal || m.name.toLowerCase() === model.toLowerCase(),
  );
  return new Set((meta?.fields || []).filter((f) => f.type === "Int").map((f) => f.name));
}

async function buildData(def: ResourceDef, body: Record<string, unknown>, create: boolean) {
  const data: Record<string, unknown> = {};
  const ints = intFields(def.model);
  for (const f of def.fields) {
    if (!(f.key in body)) continue;
    let v = body[f.key];
    const numeric = f.type === "number" || (f.type === "select" && ints.has(f.key));
    if (v === "" || v === null || v === undefined) {
      if (f.type === "password") continue;
      if (numeric) {
        if (create || f.key !== def.idField) data[f.key] = 0;
        continue;
      }
      continue;
    }
    if (numeric) data[f.key] = Number(v) || 0;
    else if (f.type === "password") data[f.key] = await bcrypt.hash(String(v), 10);
    else data[f.key] = String(v);
  }
  if (create) {
    const id = Number(body[def.idField]);
    if (id > 0) data[def.idField] = id;
    if (def.key === "vod" && !data.vodTime) data.vodTime = Math.floor(Date.now() / 1000);
    if (def.key === "art" && !data.artTime) data.artTime = Math.floor(Date.now() / 1000);
    if (def.key === "topic" && !data.topicTime) data.topicTime = Math.floor(Date.now() / 1000);
    if (def.key === "actor" && !data.actorTime) data.actorTime = Math.floor(Date.now() / 1000);
    if (def.key === "user" && !data.userPwd) data.userPwd = await bcrypt.hash("123456", 10);
    if (def.key === "admin" && !data.adminPwd) data.adminPwd = await bcrypt.hash("123456", 10);
    if (def.key === "user" && !data.userRegTime) data.userRegTime = Math.floor(Date.now() / 1000);
    if (def.key === "gbook" && !data.gbookTime) data.gbookTime = Math.floor(Date.now() / 1000);
    if (def.key === "comment" && !data.commentTime) data.commentTime = Math.floor(Date.now() / 1000);
    if (def.key === "plog" && !data.plogTime) data.plogTime = Math.floor(Date.now() / 1000);
    if (def.key === "order" && !data.orderTime) data.orderTime = Math.floor(Date.now() / 1000);
  }
  return data;
}

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ code: 0, msg: "资源不存在" }, { status: 404 });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const size = Math.min(100, Number(url.searchParams.get("size")) || 20);
  const q = (url.searchParams.get("q") || "").trim();
  const where: Record<string, unknown> = {};
  if (q && def.searchFields.length) {
    where.OR = def.searchFields.map((f) => ({ [f]: { contains: q } }));
    if (/^\d+$/.test(q)) (where.OR as unknown[]).push({ [def.idField]: Number(q) });
  }
  const db = delegate(def.model);
  const [total, list] = await Promise.all([
    db.count({ where }),
    db.findMany({ where, orderBy: defaultOrder(def), skip: (page - 1) * size, take: size }),
  ]);
  return NextResponse.json({ code: 1, total, page, size, list });
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ code: 0, msg: "资源不存在" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data = await buildData(def, body, true);
  try {
    const row = await delegate(def.model).create({ data });
    return NextResponse.json({ code: 1, msg: "创建成功", row });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "创建失败" }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ code: 0, msg: "资源不存在" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id);
  if (!id) return NextResponse.json({ code: 0, msg: "缺少 ID" }, { status: 400 });
  const data = await buildData(def, body, false);
  try {
    const db = delegate(def.model);
    const before = await db.findUnique({ where: { [def.idField]: id } });
    if (!before) return NextResponse.json({ code: 0, msg: "记录不存在" }, { status: 404 });
    const statusKey = def.key === "order" ? "orderStatus" : def.key === "cash" ? "cashStatus" : "";
    const oldStatus = statusKey ? Number((before as Record<string, unknown>)[statusKey]) : 0;
    const newStatusRaw = statusKey ? (data as Record<string, unknown>)[statusKey] : undefined;
    const newStatus = newStatusRaw === undefined ? oldStatus : Number(newStatusRaw);
    const now = Math.floor(Date.now() / 1000);
    if (def.key === "order" && oldStatus !== 1 && newStatus === 1 && !data.orderPayTime) data.orderPayTime = now;
    if (def.key === "cash" && newStatus === 1 && !data.cashTimeAudit) data.cashTimeAudit = now;
    const row = await db.update({ where: { [def.idField]: id }, data });

    if (def.key === "order" && oldStatus !== 1 && newStatus === 1) {
      const userId = Number((before as Record<string, unknown>).userId);
      const points = Number((before as Record<string, unknown>).orderPoints) || 0;
      if (userId && points > 0) {
        await prisma.user.update({ where: { userId }, data: { userPoints: { increment: points } } }).catch(() => {});
        await prisma.plog.create({ data: { userId, plogType: 1, plogPoints: points, plogTime: now, plogRemarks: "管理员确认订单到账" } }).catch(() => {});
      }
    }
    if (def.key === "cash" && oldStatus === 0 && newStatus === 2) {
      const userId = Number((before as Record<string, unknown>).userId);
      const points = Number((before as Record<string, unknown>).cashPoints) || 0;
      if (userId && points > 0) {
        await prisma.user.update({ where: { userId }, data: { userPoints: { increment: points } } }).catch(() => {});
        await prisma.plog.create({ data: { userId, plogType: 1, plogPoints: points, plogTime: now, plogRemarks: "提现被拒绝，积分退回" } }).catch(() => {});
      }
    }
    return NextResponse.json({ code: 1, msg: "保存成功", row });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "保存失败" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ code: 0, msg: "资源不存在" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id);
  if (!id) return NextResponse.json({ code: 0, msg: "缺少 ID" }, { status: 400 });
  try {
    await delegate(def.model).delete({ where: { [def.idField]: id } });
    return NextResponse.json({ code: 1, msg: "已删除" });
  } catch (e) {
    return NextResponse.json({ code: 0, msg: e instanceof Error ? e.message : "删除失败" }, { status: 400 });
  }
}