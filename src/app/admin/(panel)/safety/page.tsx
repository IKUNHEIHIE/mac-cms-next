import { getExtra, requestIp, ipMatches } from "@/lib/extraSettings";
import SafetyForm from "@/components/admin/SafetyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "安全设置" };

export default async function SafetyPage() {
  const [extra, ip] = await Promise.all([getExtra(), requestIp()]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">安全设置</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          当前 IP {ip}，{ipMatches(ip, extra.safety.ipBlacklist) ? "已命中黑名单" : "未命中黑名单"}。
        </p>
      </div>
      <SafetyForm safety={extra.safety} currentIp={ip} captchaEnabled={Boolean(extra.captcha.enabled)} />
    </div>
  );
}