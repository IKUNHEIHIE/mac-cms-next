"use client";

import { useEffect } from "react";

export default function PlayTracker({
  rid,
  sid,
  nid,
  loggedIn,
}: {
  rid: number;
  sid: number;
  nid: number;
  loggedIn: boolean;
}) {
  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/user/ulog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 4, mid: 1, rid, sid, nid }),
      keepalive: true,
    }).catch(() => {});
  }, [rid, sid, nid, loggedIn]);
  return null;
}