import { getExtra } from "@/lib/extraSettings";
import UrlsendForm from "@/components/admin/UrlsendForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "URL 推送" };

export default async function UrlsendPage() {
  const extra = await getExtra();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">搜索引擎 URL 推送</h1>
        <p className="mt-1 text-sm text-text-tertiary">对应苹果CMS的 URLs 推送功能，当前接入百度主动推送接口。</p>
      </div>
      <UrlsendForm initial={extra.urlsend} />
    </div>
  );
}