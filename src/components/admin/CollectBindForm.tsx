"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type LocalType = { typeId: number; typeName: string; typePid: number; typeMid: number };
type RemoteType = { type_id: number; type_pid: number; type_name: string };

export default function CollectBindForm({
  initialApi,
  localTypes,
  lockApi = false,
  autoLoad = false,
  format = "auto",
}: {
  initialApi: string;
  localTypes: LocalType[];
  lockApi?: boolean;
  autoLoad?: boolean;
  format?: "auto" | "json" | "xml";
}) {
  const [api, setApi] = useState(initialApi);
  const [remoteTypes, setRemoteTypes] = useState<RemoteType[]>([]);
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const localOptions = useMemo(() => {
    const parents = localTypes.filter((t) => t.typePid === 0).sort((a, b) => a.typeId - b.typeId);
    const out: { id: number; label: string }[] = [];
    for (const p of parents) {
      out.push({ id: p.typeId, label: p.typeName });
      for (const c of localTypes.filter((t) => t.typePid === p.typeId)) out.push({ id: c.typeId, label: `　└ ${c.typeName}` });
    }
    return out;
  }, [localTypes]);

  const remoteParents = useMemo(() => remoteTypes.filter((t) => !t.type_pid), [remoteTypes]);
  const remoteChildren = useMemo(
    () => remoteTypes.filter((t) => t.type_pid).reduce<Record<number, RemoteType[]>>((acc, t) => {
      (acc[t.type_pid] ||= []).push(t);
      return acc;
    }, {}),
    [remoteTypes],
  );

  async function load() {
    setBusy("load");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/collect/bind?api=${encodeURIComponent(api)}&format=${format}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "加载失败");
      setRemoteTypes(data.remoteTypes || []);
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(data.bindings || {})) next[String(k)] = String(v);
      setBindings(next);
      setLoaded(true);
      setMsg(`已加载 ${data.remoteTypes?.length || 0} 个资源站分类`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "加载失败");
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    if (autoLoad && initialApi) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function autoMatch() {
    setBusy("auto");
    setMsg("");
    try {
      const res = await fetch("/api/admin/collect/bind/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api, format }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "智能绑定失败");
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(data.bindings || {})) next[String(k)] = String(v);
      setBindings(next);
      setMsg(data.msg || "智能绑定完成");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "智能绑定失败");
    } finally {
      setBusy("");
    }
  }

  async function save() {
    setBusy("save");
    setMsg("");
    try {
      const res = await fetch("/api/admin/collect/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api, bindings }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setMsg(data.msg);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy("");
    }
  }

  function row(r: RemoteType, child = false) {
    const value = bindings[String(r.type_id)] || "";
    return (
      <tr key={r.type_id} className="border-t border-card-border">
        <td className="px-4 py-2.5 text-text-tertiary">{r.type_id}</td>
        <td className={`px-4 py-2.5 text-text-secondary ${child ? "pl-8" : "font-medium"}`}>
          {child ? `└ ${r.type_name}` : r.type_name}
        </td>
        <td className="px-4 py-2.5">
          <select
            value={value}
            onChange={(e) => setBindings({ ...bindings, [String(r.type_id)]: e.target.value })}
            className="h-9 w-full max-w-[260px] rounded-lg border border-card-border bg-background-gray-primary px-2 text-sm"
          >
            <option value="">沿用原分类 ID{r.type_id}</option>
            {localOptions.map((o) => (
              <option key={o.id} value={String(o.id)}>{o.label}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2.5 text-right">
          {value ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">已绑定</span> : <span className="text-xs text-text-tertiary">未绑定</span>}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <label className="mb-1.5 block text-sm text-text-secondary">资源站接口地址</label>
        <div className="flex flex-wrap gap-2">
          {lockApi ? (
            <div className="flex h-10 min-w-[320px] flex-1 items-center rounded-lg bg-background-gray-primary px-3 font-mono text-xs text-text-tertiary">{api}</div>
          ) : (
            <input value={api} onChange={(e) => setApi(e.target.value)} className="h-10 min-w-[320px] flex-1 rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm" />
          )}
          <button type="button" onClick={load} disabled={Boolean(busy)} className="h-10 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60">
            {busy === "load" ? "加载中…" : "刷新分类"}
          </button>
        </div>
        <p className="mt-2 text-xs text-text-tertiary">
          绑定关系按接口地址全局保存，同一接口的所有采集节点共用；未绑定时沿用资源站原分类 ID。
        </p>
      </div>

      {loaded ? (
        <div className="overflow-hidden rounded-xl border border-card-border">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-background-gray-primary px-4 py-3">
            <h2 className="font-semibold text-text-primary">资源站分类 → CMS 分类</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={autoMatch} disabled={Boolean(busy)} className="h-9 rounded-lg border border-card-border px-3 text-sm text-text-secondary hover:bg-card-surface-area disabled:opacity-50">{busy === "auto" ? "智能匹配中…" : "一键智能绑定"}</button>
              <button type="button" onClick={save} disabled={Boolean(busy)} className="h-9 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white disabled:opacity-60">
                {busy === "save" ? "保存中…" : "保存绑定"}
              </button>
              <Link href="/admin/collect" className="h-9 rounded-lg border border-card-border px-3 text-sm leading-9 text-text-secondary">去采集</Link>
            </div>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="sticky top-0 bg-card-surface-area text-xs text-text-tertiary">
                <tr><th className="px-4 py-2">资源站 ID</th><th className="px-4 py-2">资源站分类</th><th className="px-4 py-2">绑定到 CMS 分类</th><th className="px-4 py-2 text-right">状态</th></tr>
              </thead>
              <tbody>
                {remoteParents.map((p) => (
                  <Fragment key={p.type_id}>
                    {row(p)}
                    {(remoteChildren[p.type_id] || []).map((c) => row(c, true))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {msg ? <p className="text-sm text-text-secondary">{msg}</p> : null}
    </div>
  );
}