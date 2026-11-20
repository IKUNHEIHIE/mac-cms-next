"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JsonEditorForm({
  field,
  initial,
  help,
  submitText = "保存",
  rows = 14,
  onSaved,
}: {
  field: "players" | "timming" | "urlsend" | "domain";
  initial: unknown;
  help?: string;
  submitText?: string;
  rows?: number;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch {
        throw new Error("JSON 格式不正确");
      }
      const res = await fetch("/api/admin/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setOk(true);
      setMsg("已保存");
      onSaved?.();
      router.refresh();
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <textarea
        rows={rows}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="w-full rounded-xl border border-card-border bg-background-gray-primary p-4 font-mono text-xs leading-6 text-text-secondary outline-none focus:border-primary-500"
      />
      {help ? <p className="text-xs leading-6 text-text-tertiary">{help}</p> : null}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="h-10 rounded-lg bg-primary-500 px-6 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "保存中…" : submitText}
        </button>
        {msg ? <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{msg}</span> : null}
      </div>
    </form>
  );
}