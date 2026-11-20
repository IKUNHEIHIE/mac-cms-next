import { NextResponse } from "next/server";
import { ADMIN_COOKIE, clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie(ADMIN_COOKIE);
  return NextResponse.json({ code: 1 });
}

export const dynamic = "force-dynamic";