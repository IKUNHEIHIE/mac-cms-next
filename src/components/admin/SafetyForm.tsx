"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SafetyConfig } from "@/lib/extraSettings";

export default function SafetyForm({ safety, currentIp, captchaEnabled }: { safety: SafetyConfig; currentIp: string; captchaEnabled: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState(safety);
  const [captcha, setCaptcha] = useState(captchaEnabled);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ safety: values, captcha: { enabled: captcha ? 1 : 0 } }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setOk(true);
      setMsg("安全设置已保存");
      router.refresh();
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  const selfBlocked = currentIp && values.ipBlacklist.split(/[\s,;，；]+/).some((r) => {
    const rule = r.trim();
    if (!rule) return false;
    return rule.endsWith("*") ? currentIp.startsWith(rule.slice(0, -1)) : rule === currentIp;
  });

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-2 font-semibold text-text-primary">IP 黑名单</h2>
        <p className="mb-3 text-sm text-text-tertiary">
          每行或逗号分隔一个 IP，支持前缀通配（如 203.0.113.*）。命中后前台、会员中心、后台与登录/评论接口均会拒绝访问。
        </p>
        <textarea
          rows={8}
          value={values.ipBlacklist}
          onChange={(e) => setValues({ ...values, ipBlacklist: e.target.value })}
          placeholder="1.2.3.4&#10;203.0.113.*"
          className="w-full rounded-lg border border-card-border bg-background-gray-primary p-3 font-mono text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-text-tertiary">当前访问 IP：<code className="text-text-secondary">{currentIp}</code></span>
          {values.ipBlacklist && selfBlocked ? (
            <span className="rounded-md bg-red-50 px-2 py-1 text-red-600">当前 IP 已在黑名单中，保存后您将无法再访问本站</span>
          ) : null}
        </div>
      </div>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-2 font-semibold text-text-primary">受限提示</h2>
        <input
          value={values.notice}
          onChange={(e) => setValues({ ...values, notice: e.target.value })}
          placeholder="可选：访问受限时展示的说明"
          className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
        />
      </div>
      <div className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-2 font-semibold text-text-primary">登录验证码</h2>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={captcha} onChange={(e) => setCaptcha(e.target.checked)} className="h-4 w-4 accent-primary-500" />
          会员登录 / 注册需要输入算术验证码
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="h-10 rounded-lg bg-primary-500 px-6 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "保存中…" : "保存安全设置"}
        </button>
        {msg ? <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{msg}</span> : null}
      </div>
    </form>
  );
}