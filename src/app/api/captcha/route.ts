import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";

export async function GET() {
  return NextResponse.json({ code: 1, ...createCaptcha() });
}

export const dynamic = "force-dynamic";