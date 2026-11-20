import Link from "next/link";
import type { VodLike } from "@/lib/maccms";
import { poster, vodLink, vodSubline } from "@/lib/maccms";

export type VodCardData = VodLike & {
  vodActor?: string | null;
  vodSub?: string | null;
  vodHits?: number | null;
  vodClass?: string | null;
  vodPicThumb?: string | null;
};

export default function VodCard({
  vod,
  playlink = 0,
  showDate = false,
  num,
}: {
  vod: VodCardData;
  playlink?: number;
  showDate?: boolean;
  num?: number;
}) {
  const href = vodLink(vod, playlink);
  const sub = vod.vodSub || vod.vodActor || "未知";
  return (
    <li className={`vodlist_item${num !== undefined ? ` num_${num}` : ""}`}>
      <Link
        className="vodlist_thumb"
        href={href}
        title={vod.vodName}
        style={{ backgroundImage: `url(${poster(vod.vodPicThumb || vod.vodPic)})` }}
      >
        <span className="play hidden_xs" />
        {showDate ? null : (
          <span className="vodlist_top">
            {vod.vodYear ? <em className="voddate voddate_year">{vod.vodYear}</em> : null}
            {vod.vodClass ? <em className="voddate voddate_type">{vod.vodClass.slice(0, 2)}</em> : null}
          </span>
        )}
        <span className={`pic_text text_right${vod.vodScore ? " text_dy" : ""}`}>
          {vodSubline(vod)}
        </span>
      </Link>
      <div className="vodlist_titbox">
        <p className="vodlist_title">
          <Link href={href} title={vod.vodName}>
            {vod.vodName}
          </Link>
        </p>
        <p className="vodlist_sub">{sub}</p>
      </div>
    </li>
  );
}