"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TimingTask } from "@/lib/extraSettings";
import { WEEKDAY_LABELS } from "@/lib/timing";

type CollectSource = { id: number; name: string; url: string; format: "auto" | "json" | "xml" };

export default function TimingQuickAdd({
  tasks,
  defaultApi,
  sources,
}: {
  tasks: TimingTask[];
  defaultApi: string;
  sources: CollectSource[];
}) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<"daily" | "weekly">("daily");
  const [time, setTime] = useState("06:00");
  const [weekday, setWeekday] = useState(1);
  const initialSource = sources.find((s) => s.url === defaultApi) || sources[0];
  const [sourceId, setSourceId] = useState(initialSource ? String(initialSource.id) : "");
  const [sourceName, setSourceName] = useState(initialSource?.name || "");
  const [api, setApi] = useState(initialSource?.url || defaultApi);
  const [format, setFormat] = useState<"auto" | "json" | "xml">(initialSource?.format || "auto");
  const [pages, setPages] = useState(20);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function changeSource(value: string) {
    setSourceId(value);
    const source = sources.find((s) => String(s.id) === value);
    if (source) {
      setSourceName(source.name);
      setApi(source.url);
      setFormat(source.format);
    } else {
      setSourceName("");
    }
  }

  function changeSchedule(value: "daily" | "weekly") {
    setSchedule(value);
    setPages(value === "weekly" ? 80 : 20);
  }

  async function add() {
    setBusy(true);
    setMsg("");
    try {
      const hours = schedule === "daily" ? 24 : 168;
      const label = schedule === "daily" ? "每天采集当天影片" : "每周采集本周影片";
      const task: TimingTask = {
        id: `collect-${schedule}-${Date.now()}`,
        name: `${sourceName ? `${sourceName} · ` : ""}${label} ${time}`,
        action: "collect",
        sourceId: sourceId ? Number(sourceId) : 0,
        sourceName,
        schedule,
        time,
        weekdays: schedule === "weekly" ? [weekday] : [],
        intervalMinutes: schedule === "daily" ? 1440 : 10080,
        enabled: 1,
        params: JSON.stringify({ api, pages, hours, ...(format === "auto" ? {} : { format }), ...(sourceId ? { sourceId: Number(sourceId) } : {}) }),
        lastRun: 0,
      };
      const res = await fetch("/api/admin/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timming: [...tasks, task] }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setMsg(`已添加：${task.name}，采集最近 ${hours} 小时`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
      <h2 className="mb-1 font-semibold text-text-primary">快速添加采集计划</h2>
      <p className="mb-4 text-xs leading-6 text-text-tertiary">
        每天任务自动采集最近 24 小时，每周任务自动采集最近 168 小时。每个任务可以选择不同采集源，重复添加即可为多个资源站分别定时采集；需要多选星期或自定义参数时，可在下方 JSON 中继续编辑。
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-text-secondary">
          <span className="mb-1.5 block">采集源</span>
          <select
            value={sourceId}
            onChange={(e) => changeSource(e.target.value)}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          >
            <option value="">自定义接口</option>
            {sources.map((source) => (
              <option key={source.id} value={String(source.id)}>
                {source.name} · {source.url}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-secondary">
          <span className="mb-1.5 block">执行频率</span>
          <select
            value={schedule}
            onChange={(e) => changeSchedule(e.target.value as "daily" | "weekly")}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          >
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
          </select>
        </label>
        <label className="text-sm text-text-secondary">
          <span className="mb-1.5 block">执行时间</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
        </label>
        {schedule === "weekly" ? (
          <label className="text-sm text-text-secondary">
            <span className="mb-1.5 block">星期</span>
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
            >
              {WEEKDAY_LABELS.map((label, index) => (
                <option key={label} value={index}>{label}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="text-sm text-text-secondary">
            <span className="mb-1.5 block">采集范围</span>
            <div className="flex h-10 items-center rounded-lg bg-background-gray-primary px-3 text-text-tertiary">最近 24 小时</div>
          </div>
        )}
        <label className="text-sm text-text-secondary">
          <span className="mb-1.5 block">页数上限（每页 20 条）</span>
          <input
            type="number"
            min={1}
            max={100}
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
        </label>
        <label className="text-sm text-text-secondary">
          <span className="mb-1.5 block">接口格式</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "auto" | "json" | "xml")}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          >
            <option value="auto">自动</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
          </select>
        </label>
        <label className="text-sm text-text-secondary xl:col-span-2">
          <span className="mb-1.5 block">资源站接口</span>
          <input
            value={api}
            onChange={(e) => setApi(e.target.value)}
            className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="h-10 w-full rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "保存中…" : "添加并启用"}
          </button>
        </div>
      </div>
      {msg ? <p className={`mt-3 text-sm ${msg.startsWith("已添加") ? "text-green-600" : "text-red-500"}`}>{msg}</p> : null}
    </div>
  );
}