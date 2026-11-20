"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  hidden?: boolean;
};

export default function ApiForm({
  action,
  fields,
  submitText = "提交",
  redirect,
  refresh,
  successMsg = "操作成功",
  className,
  captcha = false,
}: {
  action: string;
  fields: Field[];
  submitText?: string;
  redirect?: string;
  refresh?: boolean;
  successMsg?: string;
  className?: string;
  captcha?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || ""])),
  );
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cap, setCap] = useState<{ token: string; svg: string } | null>(null);
  const [capAnswer, setCapAnswer] = useState("");

  async function loadCaptcha() {
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      const data = await res.json();
      if (data.code === 1) {
        setCap({ token: data.token, svg: data.svg });
        setCapAnswer("");
      }
    } catch {}
  }

  useEffect(() => {
    if (captcha) loadCaptcha();
  }, [captcha]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(captcha ? { ...values, captcha_token: cap?.token || "", captcha_answer: capAnswer } : values),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "操作失败");
      setOk(true);
      setMsg(data.msg || successMsg);
      if (redirect) {
        router.push(redirect);
        router.refresh();
      } else if (refresh) {
        router.refresh();
      }
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "操作失败");
      if (captcha) loadCaptcha();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={className}>
      {fields.map((f) =>
        f.hidden ? null : (
          <div className="mc_form_row" key={f.name}>
            <label>{f.label}</label>
            {f.options ? (
              <select
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                value={values[f.name]}
                required={f.required}
                placeholder={f.placeholder}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            )}
          </div>
        ),
      )}
      {captcha ? (
        <div className="mc_form_row">
          <label>验证码</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {cap ? (
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(cap.svg)}`}
                alt="验证码"
                onClick={loadCaptcha}
                style={{ height: 40, cursor: "pointer", borderRadius: 4, border: "1px solid #eee" }}
                title="点击刷新"
              />
            ) : null}
            <input
              value={capAnswer}
              onChange={(e) => setCapAnswer(e.target.value)}
              placeholder="请输入计算结果"
              style={{ width: 120 }}
              required
            />
          </div>
        </div>
      ) : null}
      <div className="mc_form_row">
        <label />
        <button className="mc_btn" type="submit" disabled={busy}>
          {busy ? "提交中…" : submitText}
        </button>
        {msg ? (
          <span style={{ marginLeft: "0.2rem", fontSize: "0.3rem", color: ok ? "#3a3" : "#ff5f00" }}>{msg}</span>
        ) : null}
      </div>
    </form>
  );
}