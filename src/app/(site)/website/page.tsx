import Link from "next/link";
import { prisma } from "@/lib/db";
import { poster } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "网址导航" };

export default async function WebsitePage() {
  const sites = await prisma.website.findMany({ where: { websiteStatus: 1 }, orderBy: { websiteSort: "asc" } });
  return (
    <div className="container">
      <div className="pannel clearfix">
        <div className="pannel_head clearfix">
          <h2 className="title">网址导航</h2>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
          {sites.map((s) => (
            <li key={s.websiteId} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: "0.3rem" }}>
              <Link href={`/website/${s.websiteId}`} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <span
                  style={{
                    width: "1.2rem",
                    height: "1.2rem",
                    backgroundImage: `url(${poster(s.websiteLogo)})`,
                    backgroundSize: "cover",
                    borderRadius: 6,
                  }}
                />
                <span>
                  <span style={{ display: "block", color: "#333" }}>{s.websiteName}</span>
                  <span style={{ display: "block", color: "#999", fontSize: "0.28rem" }}>{s.websiteJumpurl}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {sites.length === 0 ? <div className="show_no">暂无网址</div> : null}
      </div>
    </div>
  );
}