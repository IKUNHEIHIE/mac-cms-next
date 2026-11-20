import { prisma } from "@/lib/db";
import UploadForm from "@/components/admin/UploadForm";
import { fmtTime } from "@/lib/maccms";

export const dynamic = "force-dynamic";
export const metadata = { title: "文件上传" };

export default async function UploadPage() {
  const list = await prisma.annex.findMany({ orderBy: { annexId: "desc" }, take: 20 });
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary">文件上传</h1>
      <UploadForm />
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-3 font-semibold text-text-primary">最近上传</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-text-tertiary">
            <tr><th className="py-2">文件</th><th className="py-2">大小</th><th className="py-2">类型</th><th className="py-2">时间</th></tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {list.map((a) => (
              <tr key={a.annexId}>
                <td className="py-2"><a href={a.annexFile} target="_blank" rel="noreferrer" className="text-primary-500">{a.annexFile}</a></td>
                <td className="py-2 text-text-tertiary">{(a.annexSize / 1024).toFixed(0)} KB</td>
                <td className="py-2 text-text-tertiary">{a.annexType}</td>
                <td className="py-2 text-text-tertiary">{fmtTime(a.annexTime, true)}</td>
              </tr>
            ))}
            {list.length === 0 ? <tr><td colSpan={4} className="py-6 text-center text-text-tertiary">暂无上传记录</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}