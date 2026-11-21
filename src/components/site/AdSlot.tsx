import Link from "next/link";
import { getExtra, type AdsConfig } from "@/lib/extraSettings";

export default async function AdSlot({ slot }: { slot: keyof AdsConfig }) {
  const extra = await getExtra();
  const ad = extra.ads[slot];
  if (!ad?.enabled) return null;
  const link = /^https?:\/\//i.test(ad.link) || ad.link.startsWith("/") ? ad.link : "";
  const inner = ad.pic ? (
    <span
      className="mc_ad"
      style={{ display: "block", width: "100%", height: "2.4rem", backgroundImage: `url(${ad.pic})`, backgroundSize: "cover", backgroundPosition: "center" }}
    />
  ) : (
    <span className="mc_ad mc_ad_text">
      <strong>{ad.title || "广告位"}</strong>
      {ad.sub ? <em>{ad.sub}</em> : null}
      {ad.text ? <span>{ad.text}</span> : null}
    </span>
  );
  return (
    <div className="mc_ad_wrap">
      {link ? (
        /^https?:/i.test(link) ? (
          <a href={link} target="_blank" rel="noreferrer sponsored">{inner}</a>
        ) : (
          <Link href={link}>{inner}</Link>
        )
      ) : (
        inner
      )}
    </div>
  );
}