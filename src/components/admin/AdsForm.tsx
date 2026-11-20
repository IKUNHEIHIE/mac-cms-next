"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdsConfig, AdSlotConfig } from "@/lib/extraSettings";

const LABELS: Record<keyof AdsConfig, string> = {
  home: "首页横幅",
  list: "分类列表页",
  search: "搜索结果页",
  detailRight: "详情页右侧",
  playBottom: "播放页底部",
};

function SlotEditor({
  name,
  value,
  onChange,
}: {
  name: string;
  value: AdSlotConfig;
  onChange: (v: AdSlotConfig) => void;
}) {
  const set = (k: keyof AdSlotConfig, v: string | number) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3 rounded-2xl border border-card-border bg-card-surface-area p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">{name}</h3>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={Boolean(value.enabled)} onChange={(e) => set("enabled", e.target.checked ? 1 : 0)} className="h-4 w-4 accent-primary-500" />
          启用
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="标题（文字广告）" className="h-9 rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm" />
        <input value={value.sub} onChange={(e) => set("sub", e.target.value)} placeholder="副标题" className="h-9 rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm" />
        <input value={value.pic} onChange={(e) => set("pic", e.target.value)} placeholder="图片地址（填了图片则显示图片）" className="h-9 rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm md:col-span-2" />
        <input value={value.link} onChange={(e) => set("link", e.target.value)} placeholder="跳转链接，如 https://... 或 /vod/type/1" className="h-9 rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm md:col-span-2" />
        <input value={value.text} onChange={(e) => set("text", e.target.value)} placeholder="文字广告内容" className="h-9 rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm md:col-span-2" />
      </div>
    </div>
  );
}

export default function AdsForm({ ads }: { ads: AdsConfig }) {
  const router = useRouter();
  const [state, setState] = useState<AdsConfig>(ads);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ads: state }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setOk(true);
      setMsg("广告设置已保存");
      router.refresh();
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {(Object.keys(LABELS) as (keyof AdsConfig)[]).map((key) => (
        <SlotEditor key={key} name={LABELS[key]} value={state[key]} onChange={(v) => setState({ ...state, [key]: v })} />
      ))}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="h-10 rounded-lg bg-primary-500 px-6 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "保存中…" : "保存广告设置"}
        </button>
        {msg ? <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{msg}</span> : null}
      </div>
    </form>
  );
}