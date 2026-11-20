import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const MODELS = [
  "vod",
  "type",
  "art",
  "topic",
  "actor",
  "role",
  "manga",
  "website",
  "user",
  "group",
  "order",
  "card",
  "cash",
  "plog",
  "comment",
  "gbook",
  "link",
  "collect",
  "admin",
  "annex",
  "visit",
  "ulog",
  "setting",
];

export async function GET() {
  if (!(await assertAdmin())) return new Response("未登录", { status: 401 });
  const data: Record<string, unknown[]> = {};
  for (const m of MODELS) {
    const db = (prisma as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[m];
    data[m] = await db.findMany();
  }
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), tables: data }, null, 1);
  const name = `maccms-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return new Response(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}