"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CjRunButton({ nodeid }: { nodeid: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/cj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeid }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "采集失败");
      setMsg(data.msg);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "采集失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-md bg-primary-500 px-3 py-1.5 text-xs text-white disabled:opacity-50"
      >
        {busy ? "采集中…" : "开始采集"}
      </button>
      {msg ? <span className="ml-2 text-xs text-text-tertiary">{msg}</span> : null}
    </span>
  );
}