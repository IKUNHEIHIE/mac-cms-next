import VodCard from "@/components/site/VodCard";
import Pagination from "@/components/site/Pagination";
import { prisma } from "@/lib/db";
import { getSiteContext, pageParam } from "@/lib/site";
import { vodCardSelect } from "@/lib/vodQuery";

export const dynamic = "force-dynamic";
export const metadata = { title: "最新更新" };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const size = 60;
  const { settings } = await getSiteContext();
  const [total, list] = await Promise.all([
    prisma.vod.count({ where: { vodStatus: 1 } }),
    prisma.vod.findMany({
      where: { vodStatus: 1 },
      orderBy: { vodTime: "desc" },
      skip: (page - 1) * size,
      take: size,
      select: vodCardSelect(settings.theme.playlink),
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / size));
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <span className="pull_right">共 {total} 部影片</span>
          <h2 className="title">最新更新</h2>
        </div>
        <ul className="vodlist vodlist_wi clearfix">
          {list.map((v, i) => (
            <VodCard key={v.vodId} vod={v} playlink={settings.theme.playlink} num={i + 1} />
          ))}
        </ul>
        <Pagination page={page} pageCount={pageCount} basePath="/map" />
      </div>
    </div>
  );
}