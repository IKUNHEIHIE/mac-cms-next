"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function FavButton({ rid, mid = 1, loggedIn }: { rid: number; mid?: number; loggedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function fav() {
    if (!loggedIn) {
      router.push("/user/login");
      return;
    }
    try {
      const res = await fetch("/api/user/ulog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 1, mid, rid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "收藏失败");
      setState("done");
      setMsg(data.msg || "收藏成功");
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "收藏失败");
    }
  }

  return (
    <span style={{ position: "relative" }}>
      <a href="javascript:void(0)" onClick={fav} title="收藏">
        <Icon code={0xe629} />
        &nbsp;{state === "done" ? "已收藏" : "我要收藏"}
      </a>
      {msg ? <em style={{ fontSize: "0.25rem", marginLeft: "0.1rem", color: "#ff5f00" }}>{msg}</em> : null}
    </span>
  );
}