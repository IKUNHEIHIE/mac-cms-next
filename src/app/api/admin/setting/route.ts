import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { saveSetting } from "@/lib/settings";

export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ code: 0, msg: "未登录" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  let site;
  let theme;
  if (body.site && typeof body.site === "object") site = await saveSetting("site", body.site);
  if (body.theme && typeof body.theme === "object") theme = await saveSetting("theme", body.theme);
  return NextResponse.json({ code: 1, msg: "保存成功", site, theme });
}

export const dynamic = "force-dynamic";