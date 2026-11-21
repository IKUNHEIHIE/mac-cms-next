"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CollectControls({
  running,
  status,
  pid,
}: {
  running: boolean;
  status: string;
  pid?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function call(action: "start" | "pause" | "restart") {
    if (action === "restart" && !window.confirm("重新采集会从第 1 页开始，已有影片会自动去重。确定继续？")) return;
    setBusy(action);
    setMsg("");
    try {
      const res = await fetch("/api/admin/collect-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "操作失败");
      setMsg(data.msg);
      setTimeout(() => router.refresh(), 1200);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!running ? (
        <button
          type="button"
          disabled={Boolean(busy) || status === "done"}
          onClick={() => call("start")}
          className="h-10 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy === "start" ? "启动中…" : "继续采集"}
        </button>
      ) : (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => call("pause")}
          className="h-10 rounded-lg bg-red-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy === "pause" ? "暂停中…" : "暂停采集"}
        </button>
      )}
      <button
        type="button"
        disabled={Boolean(busy) || running}
        onClick={() => call("restart")}
        className="h-10 rounded-lg border border-card-border px-5 text-sm text-text-secondary hover:bg-background-gray-primary disabled:opacity-50"
      >
        {busy === "restart" ? "启动中…" : "重新采集"}
      </button>
      {running && pid ? <span className="text-xs text-text-tertiary">进程 PID {pid}</span> : null}
      {msg ? <span className="text-sm text-green-600">{msg}</span> : null}
    </div>
  );
}