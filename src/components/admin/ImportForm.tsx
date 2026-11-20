"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportForm() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("导入会先清空同名数据表再写入备份，确定继续吗？建议先导出当前备份。")) return;
    setBusy(true);
    setMsg("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const tables = parsed.tables || parsed;
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "导入失败");
      setOk(true);
      setMsg(`导入完成：${Object.entries(data.counts || {}).map(([k, v]) => `${k} ${v}`).join("，")}`);
      router.refresh();
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "导入失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50/40 p-5">
      <h2 className="font-semibold text-text-primary">导入 JSON 备份</h2>
      <p className="text-sm leading-6 text-text-tertiary">
        导入会覆盖备份中出现的所有表（先清空再写入）。请确认当前管理员账号也会被包含在备份中，否则可能无法再次登录。
      </p>
      <input type="file" accept="application/json,.json" disabled={busy} onChange={onChange} className="block text-sm text-text-secondary" />
      {msg ? <p className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{msg}</p> : null}
    </div>
  );
}