"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    fd.append("file", input.files[0]);
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "上传失败");
      setUrl(data.url);
      setMsg("上传成功");
      input.value = "";
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-card-border bg-card-surface-area p-5">
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">选择文件（图片 / 视频 / m3u8，≤50MB）</label>
        <input name="file" type="file" className="block w-full text-sm text-text-secondary" />
      </div>
      <button type="submit" disabled={busy} className="h-10 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "上传中…" : "上传"}
      </button>
      {msg ? <p className={`text-sm ${url ? "text-green-600" : "text-red-500"}`}>{msg}</p> : null}
      {url ? (
        <div className="rounded-lg bg-background-gray-primary p-3 text-sm">
          <p className="text-text-tertiary">文件地址：</p>
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="mt-1 h-9 w-full rounded border border-card-border bg-white px-2 text-text-secondary" />
        </div>
      ) : null}
    </form>
  );
}