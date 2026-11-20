import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "系统设置" };

export default async function SettingPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary">系统设置</h1>
      <SettingsForm settings={settings as unknown as { site: Record<string, unknown>; theme: Record<string, unknown> }} />
    </div>
  );
}