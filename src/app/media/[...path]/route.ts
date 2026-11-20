import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  m3u8: "application/vnd.apple.mpegurl",
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const rel = (parts || []).join("/");
  if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
    return new Response("Not found", { status: 404 });
  }
  const base = path.join(process.cwd(), "public", "uploads");
  const abs = path.join(base, rel);
  if (!abs.startsWith(base)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(abs);
    const ext = (rel.split(".").pop() || "").toLowerCase();
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}