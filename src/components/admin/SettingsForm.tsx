"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  site: Record<string, unknown>;
  theme: Record<string, unknown>;
};

type FieldDef = { key: string; label: string; type?: "text" | "number" | "textarea" | "select"; options?: { value: string; label: string }[] };

const SITE_FIELDS: FieldDef[] = [
  { key: "site_name", label: "网站名称" },
  { key: "site_url", label: "网站地址" },
  { key: "adminPath", label: "后台访问路径" },
  { key: "site_keywords", label: "SEO 关键词" },
  { key: "site_description", label: "SEO 描述", type: "textarea" },
  { key: "site_email", label: "联系邮箱" },
  { key: "site_qq", label: "客服 QQ" },
  { key: "site_icp", label: "ICP 备案号" },
  { key: "search_hot", label: "热门搜索词", type: "textarea" },
  { key: "copyright_notice", label: "版权提示", type: "textarea" },
];

const SWITCHES: FieldDef[] = [
  { key: "site_status", label: "网站开放" },
  { key: "comment_status", label: "开启评论" },
  { key: "gbook_status", label: "开启留言" },
  { key: "user_status", label: "开启会员中心" },
  { key: "copyright_status", label: "版权拦截" },
];

const THEME_FIELDS: FieldDef[] = [
  { key: "hotTitle", label: "首页热门标题" },
  { key: "hotNum", label: "热门数量", type: "number" },
  { key: "homeNum", label: "分类展示数量", type: "number" },
  { key: "notice", label: "首页公告", type: "textarea" },
  { key: "footText", label: "页脚说明", type: "textarea" },
  {
    key: "color",
    label: "主题色",
    type: "select",
    options: [
      { value: "default", label: "橘色" },
      { value: "green", label: "绿色" },
      { value: "blue", label: "蓝色" },
      { value: "pink", label: "粉色" },
      { value: "red", label: "红色" },
      { value: "gold", label: "金色" },
    ],
  },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [site, setSite] = useState<Record<string, unknown>>(settings.site);
  const [theme, setTheme] = useState<Record<string, unknown>>(settings.theme);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const input = (obj: Record<string, unknown>, setObj: (v: Record<string, unknown>) => void, f: FieldDef) => {
    const v = obj[f.key];
    if (f.type === "select") {
      return (
        <select
          value={String(v ?? "")}
          onChange={(e) => setObj({ ...obj, [f.key]: e.target.value })}
          className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
        >
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (f.type === "textarea") {
      return (
        <textarea
          rows={3}
          value={String(v ?? "")}
          onChange={(e) => setObj({ ...obj, [f.key]: e.target.value })}
          className="w-full rounded-lg border border-card-border bg-background-gray-primary px-3 py-2 text-sm"
        />
      );
    }
    return (
      <input
        type={f.type === "number" ? "number" : "text"}
        value={String(v ?? "")}
        onChange={(e) => setObj({ ...obj, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
        className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
      />
    );
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site, theme }),
      });
      const data = await res.json();
      if (!res.ok || data.code === 0) throw new Error(data.msg || "保存失败");
      setOk(true);
      const nextPath = typeof data.site?.adminPath === "string" ? data.site.adminPath : null;
      if (nextPath && nextPath !== String(settings.site.adminPath || "/admin")) {
        setMsg(`已保存，后台新地址：${nextPath}，即将跳转`);
        setTimeout(() => window.location.assign(nextPath), 900);
        return;
      }
      setMsg("已保存，前台刷新后生效");
      router.refresh();
    } catch (err) {
      setOk(false);
      setMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-4 font-semibold text-text-primary">站点设置</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {SITE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm text-text-secondary">{f.label}</label>
              {input(site, setSite, f)}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-6 text-text-tertiary">
          后台访问路径使用 2–32 位字母、数字、下划线或短横线，例如 /my-admin；默认 /admin。修改后旧地址会自动跳转到新地址。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {SWITCHES.map((f) => (
            <label key={f.key} className="flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={Number(site[f.key]) === 1}
                onChange={(e) => setSite({ ...site, [f.key]: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 accent-primary-500"
              />
              {f.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card-surface-area p-5">
        <h2 className="mb-4 font-semibold text-text-primary">前台主题（792 Conch）</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {THEME_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm text-text-secondary">{f.label}</label>
              {input(theme, setTheme, f)}
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">导航分类 ID（逗号分隔）</label>
            <input
              value={Array.isArray(theme.navIds) ? (theme.navIds as number[]).join(",") : ""}
              onChange={(e) =>
                setTheme({
                  ...theme,
                  navIds: e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => n > 0),
                })
              }
              className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">首页分类 ID（逗号分隔）</label>
            <input
              value={Array.isArray(theme.categoryHomeIds) ? (theme.categoryHomeIds as number[]).join(",") : ""}
              onChange={(e) =>
                setTheme({
                  ...theme,
                  categoryHomeIds: e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => n > 0),
                })
              }
              className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">播放按钮直达播放页</label>
            <select
              value={String(theme.playlink ?? 0)}
              onChange={(e) => setTheme({ ...theme, playlink: Number(e.target.value) })}
              className="h-10 w-full rounded-lg border border-card-border bg-background-gray-primary px-3 text-sm"
            >
              <option value="0">否（进入详情页）</option>
              <option value="1">是（直接播放）</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="h-10 rounded-lg bg-primary-500 px-6 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "保存中…" : "保存设置"}
        </button>
        {msg ? <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{msg}</span> : null}
      </div>
    </form>
  );
}