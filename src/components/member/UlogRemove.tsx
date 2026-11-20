"use client";

import { useRouter } from "next/navigation";

export default function UlogRemove({ rid, type = 1, label = "取消收藏" }: { rid: number; type?: number; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mc_btn plain"
      style={{ height: 26, lineHeight: "26px", fontSize: 12, padding: "0 10px" }}
      onClick={async () => {
        await fetch("/api/user/ulog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, mid: 1, rid }),
        });
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}