import { buildRss, rssResponse } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET() {
  return rssResponse(await buildRss());
}