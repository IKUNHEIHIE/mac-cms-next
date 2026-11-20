import Link from "next/link";

export default function Pagination({
  page,
  pageCount,
  basePath,
  query = {},
}: {
  page: number;
  pageCount: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const mk = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const pages: number[] = [];
  const start = Math.max(1, page - 3);
  const end = Math.min(pageCount, page + 3);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mac_pages">
      <div className="page_tip">共 {pageCount} 页</div>
      <div className="page_info">
        {page > 1 ? (
          <Link className="page_link" href={mk(page - 1)}>
            上一页
          </Link>
        ) : (
          <span className="page_link disabled">上一页</span>
        )}
        {start > 1 ? (
          <>
            <Link className="page_link" href={mk(1)}>
              1
            </Link>
            {start > 2 ? <span className="page_ell">…</span> : null}
          </>
        ) : null}
        {pages.map((p) =>
          p === page ? (
            <span key={p} className="page_link page_current">
              {p}
            </span>
          ) : (
            <Link key={p} className="page_link" href={mk(p)}>
              {p}
            </Link>
          ),
        )}
        {end < pageCount ? (
          <>
            {end < pageCount - 1 ? <span className="page_ell">…</span> : null}
            <Link className="page_link" href={mk(pageCount)}>
              {pageCount}
            </Link>
          </>
        ) : null}
        {page < pageCount ? (
          <Link className="page_link" href={mk(page + 1)}>
            下一页
          </Link>
        ) : (
          <span className="page_link disabled">下一页</span>
        )}
      </div>
    </div>
  );
}