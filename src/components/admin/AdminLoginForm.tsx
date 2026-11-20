"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_name: name, admin_pwd: pwd }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "登录失败");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">管理员账号</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="username"
          placeholder="admin"
          className="h-11 w-full rounded-lg border border-card-border bg-background-gray-primary px-4 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">登录密码</label>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 w-full rounded-lg border border-card-border bg-background-gray-primary px-4 text-sm outline-none focus:border-primary-500"
        />
      </div>
      {msg ? <p className="text-sm text-red-500">{msg}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "登录中…" : "登录管理后台"}
      </button>
      <p className="text-center text-xs text-text-tertiary">默认账号 admin / admin123</p>
    </form>
  );
}