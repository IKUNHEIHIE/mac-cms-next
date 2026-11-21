import { safeHtml } from "@/lib/sanitize";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";

export default async function WebsiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.website.findUnique({ where: { websiteId: Number(id) } });
  if (!site) notFound();
  return (
    <div className="container">
      <div className="pannel clearfix" style={{ paddingTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <div style={{ width: "2rem", height: "2rem", flex: "none", borderRadius: 10, backgroundImage: `url(${poster(site.websiteLogo)})`, backgroundSize: "cover" }} />
          <div>
            <h1 style={{ fontSize: "0.55rem", margin: "0 0 0.15rem" }}>{site.websiteName}</h1>
            <p style={{ color: "#999", fontSize: "0.32rem" }}>{site.websiteBlurb || site.websiteRemarks}</p>
            <p style={{ marginTop: "0.2rem" }}>
              <a className="mc_btn" href={site.websiteJumpurl || "#"} target="_blank" rel="noreferrer">
                访问网站
              </a>
            </p>
          </div>
        </div>
        {site.websiteContent ? (
          <div style={{ marginTop: "0.4rem", lineHeight: 1.9, color: "#555" }} dangerouslySetInnerHTML={{ __html: safeHtml(site.websiteContent) }} />
        ) : null}
        <p style={{ marginTop: "0.4rem" }}>
          <Link href="/website">← 返回网址导航</Link>
        </p>
      </div>
    </div>
  );
}