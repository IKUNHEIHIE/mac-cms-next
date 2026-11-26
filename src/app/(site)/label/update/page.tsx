import VodCard from "@/components/site/VodCard";
import { prisma } from "@/lib/db";
import { getSiteContext } from "@/lib/site";
import { vodCardSelect } from "@/lib/vodQuery";

export const dynamic = "force-dynamic";
export const metadata = { title: "最新更新" };

export default async function LabelUpdatePage() {
  const { settings } = await getSiteContext();
  const list = await prisma.vod.findMany({
    where: { vodStatus: 1 },
    orderBy: { vodTime: "desc" },
    take: 60,
    select: vodCardSelect(settings.theme.playlink),
  });
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <h2 className="title">最新更新</h2>
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