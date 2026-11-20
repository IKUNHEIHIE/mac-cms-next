import { getExtra } from "@/lib/extraSettings";
import JsonEditorForm from "@/components/admin/JsonEditorForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "播放器配置" };

export default async function PlayerPage() {
  const extra = await getExtra();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">播放器 / 线路配置</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          键为资源站的播放来源标识（vod_play_from），值为前台展示名称。保存后详情页与播放页立即生效。
        </p>
      </div>
      <JsonEditorForm
        field="players"
        initial={extra.players}
        rows={18}
        help={`示例：{"lzm3u8":"LZ线路","liangzi":"量子资源"}。未知来源会直接显示原始标识。`}
      />
    </div>
  );
}