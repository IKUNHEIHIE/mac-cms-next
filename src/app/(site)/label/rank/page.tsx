import Link from "next/link";
import VodCard from "@/components/site/VodCard";
import { prisma } from "@/lib/db";
import { getSiteContext } from "@/lib/site";
import type { Prisma } from "@prisma/client";
import { vodCardSelect } from "@/lib/vodQuery";

export const dynamic = "force-dynamic";
export const metadata = { title: "排行榜" };

const TABS = [
  { key: "all", label: "总榜", field: "vodHits" },
  { key: "day", label: "日榜", field: "vodHitsDay" },
  { key: "week", label: "周榜", field: "vodHitsWeek" },
  { key: "month", label: "月榜", field: "vodHitsMonth" },
] as const;

export default async function RankPage({ searchParams }: { searchParams: Promise<{ by?: string }> }) {
  const sp = await searchParams;
  const by = TABS.find((t) => t.key === sp.by)?.key || "all";
  const tab = TABS.find((t) => t.key === by)!;
  const orderBy = { [tab.field]: "desc" } as Prisma.VodOrderByWithRelationInput;
  const { settings } = await getSiteContext();
  const list = await prisma.vod.findMany({
    where: { vodStatus: 1 },
    orderBy,
    take: 60,
    select: vodCardSelect(settings.theme.playlink),
  });

  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <ul className="screen_list clearfix" style={{ listStyle: "none", margin: 0, padding: 0, float: "left" }}>
            {TABS.map((t) => (
              <li key={t.key} className={by === t.key ? "hl_fl" : ""} style={{ float: "left", marginRight: "0.35rem" }}>
                <Link href={`/label/rank?by=${t.key}`}>{t.label}</Link>
              </li>
            ))}
          </ul>
          <h2 className="title">排行榜</h2>
        </div>
        <ul className="vodlist vodlist_wi clearfix">
          {list.map((v, i) => (
            <VodCard key={v.vodId} vod={v} playlink={settings.theme.playlink} num={i + 1} />
          ))}
        </ul>
      </div>
    </div>
  );
}