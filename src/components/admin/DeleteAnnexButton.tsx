"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteAnnexButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("删除该文件及记录？")) return;
        setBusy(true);
        try {
          const res = await fetch(`/api/admin/annex/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok || data.code === 0) throw new Error(data.msg || "删除失败");
          router.refresh();
        } catch (e) {
          alert(e instanceof Error ? e.message : "删除失败");
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
    >
      {busy ? "删除中" : "删除"}
    </button>
  );
}