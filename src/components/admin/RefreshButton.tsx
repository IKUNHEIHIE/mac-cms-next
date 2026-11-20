"use client";

import { useState } from "react";

export default function RefreshButton() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={busy}
        className="h-10 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60"
        onClick={async () => {
          setBusy(true);
          setMsg("");
          try {
            const res = await fetch("/api/admin/revalidate", { method: "POST" });
            const data = await res.json();
            if (!res.ok || data.code === 0) throw new Error(data.msg || "刷新失败");
            setMsg(data.msg);
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "刷新失败");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "刷新中…" : "刷新全站缓存"}
      </button>
      {msg ? <span className="text-sm text-green-600">{msg}</span> : null}
    </div>
  );
}