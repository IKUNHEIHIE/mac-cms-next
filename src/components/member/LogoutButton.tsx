"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mc_btn plain"
      onClick={async () => {
        await fetch("/api/user/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      退出登录
    </button>
  );
}