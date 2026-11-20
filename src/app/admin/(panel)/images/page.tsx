import { prisma } from "@/lib/db";
import UploadForm from "@/components/admin/UploadForm";
import DeleteAnnexButton from "@/components/admin/DeleteAnnexButton";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "媒体库" };

const IMAGES = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

export default async function ImagesPage() {
  const list = await prisma.annex.findMany({
    where: { annexType: { in: IMAGES } },
    orderBy: { annexId: "desc" },
    take: 60,
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">媒体库</h1>
          <p className="mt-1 text-sm text-text-tertiary">已上传图片 {list.length} 张，可直接复制地址用于封面或广告位。</p>
        </div>
      </div>
      <UploadForm />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        {list.map((a) => (
          <div key={a.annexId} className="overflow-hidden rounded-xl border border-card-border bg-card-surface-area">
            <div className="aspect-[4/3] w-full bg-background-gray-primary" style={{ backgroundImage: `url(${a.annexFile})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="space-y-1.5 p-3">
              <input readOnly value={a.annexFile} onFocus={(e) => e.currentTarget.select()} className="h-7 w-full rounded border border-card-border bg-background-gray-primary px-1.5 text-[11px] text-text-tertiary" />
              <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                <span>{(a.annexSize / 1024).toFixed(0)} KB · {fmtTime(a.annexTime)}</span>
                <DeleteAnnexButton id={a.annexId} />
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 ? <div className="col-span-full py-10 text-center text-sm text-text-tertiary">暂无图片，先上传一张吧。</div> : null}
      </div>
    </div>
  );
}