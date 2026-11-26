"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CollectForm({ defaultApi }: { defaultApi: string }) {
  const router = useRouter();
  const [api, setApi] = useState(defaultApi);
  const [pages, setPages] = useState(3);
  const [startPage, setStartPage] = useState(1);
  const [typeId, setTypeId] = useState("");
  const [format, setFormat] = useState<"auto" | "json" | "xml">("auto");
  const [markLevel, setMarkLevel] = useState(true);
  const [busy, setBusy] = useState<"" | "types" | "collect" | "day" | "week">("");
  const [result, setResult] = useState("");
  const [ok, setOk] = useState(false);

  async function run(action: "types" | "collect", hours?: number) {
    setBusy(hours === 24 ? "day" : hours === 168 ? "week" : action);
    setResult("");
    try {
      const res = await fetch("/api/admin/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          api,
          pages: hours ? 100 : pages,
          startPage: hours ? 1 : startPage,
          hours,
          format,
          typeId: typeId ? Number(typeId) : undefined,
          markLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "采集失败");
      setOk(true);
      setResult(data.msg);
      router.refresh();
    } catch (e) {
      setOk(false);
      setResult(e instanceof Error ? e.message : "采集失败");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-card-border bg-card-surface-area p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-sm text-text-secondary">资源站接口地址</label>
          <input
            value={api}
            onChange={(e) => setApi(e.target.value)}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            兼容苹果CMS v10 JSON 接口，例如 https://lzizy.net/api.php/provide/vod/
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">采集页数（每页 20 条）</label>
          <input
            type="number"
            min={1}
            max={30}
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">起始页</label>
          <input
            type="number"
            min={1}
            value={startPage}
            onChange={(e) => setStartPage(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">接口格式</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "auto" | "json" | "xml")}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          >
            <option value="auto">自动识别 JSON/XML</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
          </select>
          <p className="mt-1 text-xs text-text-tertiary">XML 模式会自动附加 at=xml 参数</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">只采集指定分类 ID（选填）</label>
          <input
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            placeholder="如 1（电影片）"
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary">
          <input type="checkbox" checked={markLevel} onChange={(e) => setMarkLevel(e.target.checked)} className="h-4 w-4 accent-primary-500" />
          将前 12 条设为首页轮播推荐
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run("types")}
          disabled={Boolean(busy)}
          className="h-10 rounded-lg border border-card-border px-5 text-sm text-text-secondary hover:bg-background-gray-primary disabled:opacity-50"
        >
          {busy === "types" ? "导入中…" : "① 导入分类"}
        </button>
        <button
          type="button"
          onClick={() => run("collect")}
          disabled={Boolean(busy)}
          className="h-10 rounded-lg bg-primary-500 px-6 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy === "collect" ? "采集中，请稍候…" : "② 开始采集"}
        </button>
        <button
          type="button"
          onClick={() => run("collect", 24)}
          disabled={Boolean(busy)}
          className="h-10 rounded-lg border border-card-border px-5 text-sm text-text-secondary hover:bg-background-gray-primary disabled:opacity-50"
        >
          {busy === "day" ? "采集中…" : "采集当天（24小时）"}
        </button>
        <button
          type="button"
          onClick={() => run("collect", 168)}
          disabled={Boolean(busy)}
          className="h-10 rounded-lg border border-card-border px-5 text-sm text-text-secondary hover:bg-background-gray-primary disabled:opacity-50"
        >
          {busy === "week" ? "采集中…" : "采集本周（168小时）"}
        </button>
        {result ? <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{result}</span> : null}
      </div>
    </div>
  );
}