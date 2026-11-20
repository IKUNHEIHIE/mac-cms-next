"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GbookForm({ defaultContent = "" }: { defaultContent?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [content, setContent] = useState(defaultContent);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setMsg("请输入留言内容");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/gbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "提交失败");
      setMsg("留言成功，审核后展示");
      setContent("");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "提交失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ padding: "0.2rem 0" }}>
      <div className="mc_form_row">
        <label>称呼</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="选填，默认游客" maxLength={30} />
      </div>
      <div className="mc_form_row">
        <label>留言内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={255}
          placeholder="有什么想说的…"
          style={{ flex: 1, height: "1.8rem", border: "1px solid #e5e5e5", borderRadius: 4, padding: "0.2rem" }}
        />
      </div>
      <div className="mc_form_row">
        <label />
        <button className="mc_btn" type="submit" disabled={busy}>
          {busy ? "提交中…" : "提交留言"}
        </button>
        {msg ? <span className="mc_error" style={{ marginLeft: "0.2rem" }}>{msg}</span> : null}
      </div>
    </form>
  );
}