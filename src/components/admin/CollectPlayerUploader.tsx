"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CollectPlayerUploader({
  collectId,
  initial,
}: {
  collectId: number;
  initial: { name: string; from: string; file: string; type: string; status: number };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial.name);
  const [fromCodes, setFromCodes] = useState(initial.from);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function suggest() {
    setBusy("suggest");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/collect/player?nodeId=${collectId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "获取失败");
      setFromCodes(data.suggestedFrom || "");
      setMsg(data.suggestedFrom ? `已获取线路标识：${data.suggestedFrom}` : "接口未返回可用的线路标识");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "获取失败");
    } finally {
      setBusy("");
    }
  }

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMsg("请选择播放器文件");
      return;
    }
    setBusy("upload");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("nodeId", String(collectId));
      fd.append("name", name || file.name);
      fd.append("fromCodes", fromCodes);
      fd.append("file", file);
      const res = await fetch("/api/admin/collect/player", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "上传失败");
      setMsg(data.msg);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!window.confirm("确定移除该节点的播放器吗？")) return;
    setBusy("remove");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/collect/player?nodeId=${collectId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "移除失败");
      setMsg(data.msg);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "移除失败");
    } finally {
      setBusy("");
    }
  }

  const active = initial.status === 1 && initial.file;

  return (
    <div className="space-y-3 rounded-2xl border border-card-border bg-card-surface-area p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-text-primary">节点播放器</h2>
          <p className="mt-1 text-sm text-text-tertiary">
            为该采集节点单独上传播放器，仅影响本节点线路。未上传时使用系统默认 HLS 播放器。
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
          {active ? `已启用：${initial.name || initial.type}` : "未配置"}
        </span>
      </div>

      {active ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-background-gray-primary px-3 py-2 text-sm">
          <a href={initial.file} target="_blank" rel="noreferrer" download className="text-primary-500">下载播放器文件</a>
          <span className="text-text-tertiary">类型 {initial.type}</span>
          <span className="text-text-tertiary">线路 {initial.from || "未限制"}</span>
          <button type="button" onClick={remove} disabled={Boolean(busy)} className="ml-auto rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50">
            移除播放器
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">播放器名称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：量子专属播放器" className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">适用线路标识（逗号分隔）</label>
          <div className="flex gap-2">
            <input value={fromCodes} onChange={(e) => setFromCodes(e.target.value)} placeholder="如 liangzi,lzm3u8" className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm" />
            <button type="button" onClick={suggest} disabled={Boolean(busy)} className="h-10 shrink-0 rounded-lg border border-card-border px-3 text-sm text-text-secondary hover:bg-background-gray-primary disabled:opacity-50">
              {busy === "suggest" ? "获取中…" : "自动获取"}
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm text-text-secondary">播放器文件（.html / .htm / .js，≤10MB）</label>
          <input ref={fileRef} type="file" accept=".html,.htm,.js" className="block w-full text-sm text-text-secondary" />
          <p className="mt-1 text-xs leading-6 text-text-tertiary">
            HTML 播放器会以 iframe 打开，并收到 query 参数 <code>url</code>、<code>poster</code>、<code>title</code>、<code>from</code>；
            JS 播放器会加载到内置宿主页，读取 <code>window.MAC_PLAYER</code> 并渲染到 <code>#player-container</code>。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={upload} disabled={Boolean(busy)} className="h-10 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60">
          {busy === "upload" ? "上传中…" : "上传并绑定播放器"}
        </button>
        {msg ? <span className="text-sm text-text-secondary">{msg}</span> : null}
      </div>
    </div>
  );
}