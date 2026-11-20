import { NextResponse } from "next/server";
import { USER_COOKIE, clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie(USER_COOKIE);
  return NextResponse.json({ code: 1, msg: "已退出登录" });
}

export const dynamic = "force-dynamic";