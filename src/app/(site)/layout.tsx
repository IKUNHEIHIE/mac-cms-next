import type { Metadata } from "next";
import "./site.css";
import { getSiteContext } from "@/lib/site";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { isRequestBlocked } from "@/lib/extraSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContext();
  return {
    title: { default: settings.site.site_name, template: `%s - ${settings.site.site_name}` },
    description: settings.site.site_description,
    keywords: settings.site.site_keywords,
    icons: { icon: "/theme/conch/asset/img/favicon.png" },
  };
}

const COLOR_CSS: Record<string, string> = {
  default: "default.css",
  green: "green.css",
  blue: "blue.css",
  pink: "pink.css",
  red: "red.css",
  gold: "gold.css",
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  if (await isRequestBlocked()) {
    return <div style={{ padding: "120px 20px", textAlign: "center", fontSize: 16, color: "#666" }}>您的访问已被限制，如有疑问请联系站点管理员。</div>;
  }
  const { settings, navTypes } = await getSiteContext();
  const color = COLOR_CSS[settings.theme.color] || "default.css";
  return (
    <>
      <link rel="stylesheet" href="/theme/conch/asset/css/mxstyle.css" />
      <link rel="stylesheet" href="/theme/conch/asset/css/hlstyle.css" />
      <link rel="stylesheet" href={`/theme/conch/asset/css/${color}`} />
      <link rel="stylesheet" href="/theme/conch/asset/css/white.css" />
      <SiteHeader
        site={settings.site}
        theme={settings.theme}
        types={navTypes.map((t) => ({ typeId: t.typeId, typeName: t.typeName }))}
      />
      {children}
      <SiteFooter site={settings.site} />
    </>
  );
}