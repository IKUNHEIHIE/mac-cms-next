"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ resource, id }: { resource: string; id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!window.confirm("确定要删除这条记录吗？此操作不可撤销。")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/resource/${resource}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "删除失败");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={del}
      disabled={busy}
      className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
    >
      {busy ? "删除中" : "删除"}
    </button>
  );
}