"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CronRunButton() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(force: boolean) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/cron${force ? "?force=1" : ""}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "执行失败");
      setMsg(data.msg || "执行完成");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "执行失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={busy} onClick={() => run(false)} className="h-10 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "执行中…" : "执行到期任务"}
      </button>
      <button type="button" disabled={busy} onClick={() => run(true)} className="h-10 rounded-lg border border-card-border px-5 text-sm text-text-secondary hover:bg-background-gray-primary disabled:opacity-60">
        强制运行全部启用任务
      </button>
      {msg ? <span className="text-sm text-green-600">{msg}</span> : null}
    </div>
  );
}