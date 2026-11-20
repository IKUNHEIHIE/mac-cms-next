"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResourceDef } from "@/lib/adminResources";

export default function ResourceForm({
  def,
  id,
  initial,
}: {
  def: ResourceDef;
  id?: number;
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/resource/${def.key}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { ...values, id } : values),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setOk(true);
      setMsg(data.msg || "保存成功");
      router.push(`/admin/manage/${def.key}`);
      router.refresh();
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl border border-card-border bg-card-surface-area p-5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
          {!id ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                {def.idField}（留空自动编号）
              </label>
              <input
                type="number"
                value={values[def.idField] || ""}
                onChange={(e) => setValues({ ...values, [def.idField]: e.target.value })}
                className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm outline-none focus:border-primary-500"
              />
            </div>
          ) : null}
          {def.fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "lg:col-span-2" : ""}>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  rows={f.rows || 4}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-card-border bg-background-gray-primary px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              ) : f.type === "select" ? (
                <select
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm outline-none focus:border-primary-500"
                >
                  <option value="">请选择</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === "number" ? "number" : f.type === "password" ? "password" : "text"}
                  value={values[f.key] || ""}
                  placeholder={f.type === "password" ? "留空则不修改" : ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm outline-none focus:border-primary-500"
                />
              )}
              {f.help ? <p className="mt-1 text-xs text-text-tertiary">{f.help}</p> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="h-10 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/manage/${def.key}`)}
          className="h-10 rounded-lg border border-card-border px-5 text-sm text-text-secondary hover:bg-background-gray-primary"
        >
          返回列表
        </button>
        {msg ? <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{msg}</span> : null}
      </div>
    </form>
  );
}