import Link from "next/link";

export default function RankList({
  items,
  playlink = 0,
}: {
  items: { vodId: number; vodName: string; typeName: string; playHref: string; detailHref: string }[];
  playlink?: number;
}) {
  return (
    <ul className="ranklist_r clearfix">
      {items.map((v, i) => (
        <li key={v.vodId} className="part_eone">
          <Link href={playlink ? v.playHref : v.detailHref}>
            <span className={`part_nums part_num${i + 1}`}>{i + 1}</span>
            <span className="info_right">{v.typeName}</span>
            {v.vodName}
          </Link>
        </li>
      ))}
    </ul>
  );
}