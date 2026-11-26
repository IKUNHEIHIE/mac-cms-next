"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CollectNodeActions({
  nodeId,
  nodeName,
  format,
}: {
  nodeId: number;
  nodeName: string;
  format: "auto" | "json" | "xml";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"" | "full" | "current" | "week">("");
  const [msg, setMsg] = useState("");

  async function run(mode: "full" | "current" | "week") {
    setBusy(mode);
    setMsg("");
    try {
      if (mode === "full") {
        const res = await fetch("/api/admin/collect-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", nodeId }),
        });
        const data = await res.json();
        if (!res.ok || data.code === 0) throw new Error(data.msg || "启动失败");
        router.push(`/admin/collect-all?nodeId=${nodeId}`);
        return;
      }
      const res = await fetch("/api/admin/collect/node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, mode }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "采集失败");
      setMsg(data.msg);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "采集失败");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mr-1 rounded-md bg-primary-500/10 px-2 py-1 text-xs text-primary-500 hover:bg-primary-500/20"
      >
        采集
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-4xl rounded-2xl border border-card-border bg-card-surface-area p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">采集 · {nodeName}</h2>
              <button type="button" onClick={() => !busy && setOpen(false)} className="text-xl leading-none text-text-tertiary hover:text-text-primary">×</button>
            </div>
            <p className="mb-4 text-xs text-text-tertiary">接口格式：{format === "auto" ? "自动识别" : format.toUpperCase()}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button type="button" disabled={Boolean(busy)} onClick={() => run("full")} className="min-w-0 rounded-xl border border-card-border p-4 text-left hover:bg-background-gray-primary disabled:opacity-50">
                <strong className="block text-sm text-text-primary">全量采集</strong>
                <span className="mt-1 block break-words text-xs leading-5 text-text-tertiary whitespace-normal">后台从第 1 页开始全量采集，可在进度页暂停/继续。</span>
                {busy === "full" ? <span className="mt-2 block text-xs text-primary-500">启动中…</span> : null}
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => run("current")} className="min-w-0 rounded-xl border border-card-border p-4 text-left hover:bg-background-gray-primary disabled:opacity-50">
                <strong className="block text-sm text-text-primary">采集当前</strong>
                <span className="mt-1 block break-words text-xs leading-5 text-text-tertiary whitespace-normal">采集当前最新一页，约 20 条。</span>
                {busy === "current" ? <span className="mt-2 block text-xs text-primary-500">采集中…</span> : null}
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => run("week")} className="min-w-0 rounded-xl border border-card-border p-4 text-left hover:bg-background-gray-primary disabled:opacity-50">
                <strong className="block text-sm text-text-primary">采集本周</strong>
                <span className="mt-1 block break-words text-xs leading-5 text-text-tertiary whitespace-normal">采集最近 168 小时的数据。</span>
                {busy === "week" ? <span className="mt-2 block text-xs text-primary-500">采集中…</span> : null}
              </button>
            </div>
            {msg ? <p className="mt-4 break-words text-sm text-text-secondary">{msg}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
