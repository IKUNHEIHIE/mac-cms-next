"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BuyButton({ vodId }: { vodId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <span>
      <button
        type="button"
        className="mc_btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg("");
          try {
            const res = await fetch("/api/user/buy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vod_id: vodId }),
            });
            const data = await res.json();
            if (!res.ok || data.code === 0) throw new Error(data.msg || "购买失败");
            setMsg(data.msg);
            router.refresh();
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "购买失败");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "购买中…" : "积分购买"}
      </button>
      {msg ? <span style={{ marginLeft: 8, fontSize: 12, color: "#ff5f00" }}>{msg}</span> : null}
    </span>
  );
}