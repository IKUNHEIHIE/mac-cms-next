import { getExtra } from "@/lib/extraSettings";
import AdsForm from "@/components/admin/AdsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "广告管理" };

export default async function AdsPage() {
  const extra = await getExtra();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">广告管理</h1>
        <p className="mt-1 text-sm text-text-tertiary">对应 792 主题的广告位。图片广告与文字广告二选一，留空则显示文字。</p>
      </div>
      <AdsForm ads={extra.ads} />
    </div>
  );
}