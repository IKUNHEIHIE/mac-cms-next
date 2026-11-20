"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UrlsendForm({ initial }: { initial: { baiduToken: string; siteUrl: string; autoPush: number } }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setMsg("");
    try {
      const res = await fetch("/api/admin/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlsend: values }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setOk(true);
      setMsg("配置已保存");
      router.refresh();
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy("");
    }
  }

  async function push() {
    setBusy("push");
    setMsg("");
    try {
      const res = await fetch("/api/admin/urlsend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: values.baiduToken, siteUrl: values.siteUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "推送失败");
      setOk(true);
      setMsg(`${data.msg}：${String(data.result || "").slice(0, 200)}`);
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "推送失败");
    } finally {
      setBusy("");
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="space-y-4 rounded-2xl border border-card-border bg-card-surface-area p-5">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">站点地址</label>
          <input
            value={values.siteUrl}
            onChange={(e) => setValues({ ...values, siteUrl: e.target.value })}
            placeholder="https://www.example.com"
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">百度搜索资源平台 Token</label>
          <input
            value={values.baiduToken}
            onChange={(e) => setValues({ ...values, baiduToken: e.target.value })}
            placeholder="在百度搜索资源平台获取"
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
          <p className="mt-1 text-xs text-text-tertiary">域名需已在百度搜索资源平台验证，推送仅对验证域名生效。</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={Boolean(values.autoPush)} onChange={(e) => setValues({ ...values, autoPush: e.target.checked ? 1 : 0 })} className="h-4 w-4 accent-primary-500" />
          采集后自动推送最新 URL（由定时任务/采集流程触发）
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={Boolean(busy)} className="h-10 rounded-lg bg-primary-500 px-6 text-sm font-semibold text-white disabled:opacity-60">
          {busy === "save" ? "保存中…" : "保存配置"}
        </button>
        <button type="button" onClick={push} disabled={Boolean(busy)} className="h-10 rounded-lg border border-card-border px-5 text-sm text-text-secondary hover:bg-background-gray-primary disabled:opacity-60">
          {busy === "push" ? "推送中…" : "推送最新 20 条 URL"}
        </button>
        {msg ? <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{msg}</span> : null}
      </div>
    </form>
  );
}