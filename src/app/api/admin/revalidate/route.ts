import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/adminAuth";

export async function POST() {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  for (const p of ["/", "/map", "/label/rank", "/topic", "/art/type/5"]) revalidatePath(p);
  revalidatePath("/", "layout");
  return NextResponse.json({ code: 1, msg: "全站缓存已刷新" });
}

export const dynamic = "force-dynamic";