import { getExtra } from "@/lib/extraSettings";
import JsonEditorForm from "@/components/admin/JsonEditorForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "域名设置" };

export default async function DomainPage() {
  const extra = await getExtra();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">域名设置</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          记录站点绑定域名，供运维与镜像部署参考。主站地址在「系统设置」的网站地址中维护；多域名绑定由反向代理/CDN 完成。
        </p>
      </div>
      <JsonEditorForm
        field="domain"
        initial={extra.domain}
        rows={12}
        help={`示例：{"mobileUrl":"https://m.example.com","extraDomains":"www.example.com\\nexample.net"}`}
      />
    </div>
  );
}