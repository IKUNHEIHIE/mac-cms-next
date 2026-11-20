"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type CommentRow = {
  commentId: number;
  commentName: string;
  commentTime: number;
  commentContent: string;
  commentUp: number;
};

function timeAgo(ts: number) {
  const diff = Math.max(1, Math.floor(Date.now() / 1000 - ts));
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

export default function CommentBox({
  rid,
  mid = 1,
  initial,
  canPost,
  userName,
}: {
  rid: number;
  mid?: number;
  initial: CommentRow[];
  canPost: boolean;
  userName?: string;
}) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rid, mid, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "提交失败");
      setList([data.comment, ...list]);
      setContent("");
      setMsg("评论成功");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "提交失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mac_comment comm_list comm_list_box" id="pinglun">
      {canPost ? (
        <form className="mc_comment_form" onSubmit={submit}>
          <div className="mc_comment_avatar">{userName?.slice(0, 1) || "我"}</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="文明发言，理性评论…"
            maxLength={255}
          />
          <button type="submit" disabled={busy}>
            {busy ? "提交中…" : "发表评论"}
          </button>
        </form>
      ) : (
        <div className="mc_comment_login">
          请先 <Link href="/user/login">登录</Link> 后参与评论
        </div>
      )}
      {msg ? <div className="mc_comment_msg">{msg}</div> : null}
      <ul className="comment_list mc_comment_list">
        {list.map((c) => (
          <li key={c.commentId} className="comment_item">
            <div className="mc_comment_avatar">{c.commentName?.slice(0, 1) || "客"}</div>
            <div className="mc_comment_body">
              <p className="mc_comment_meta">
                <span>{c.commentName || "游客"}</span>
                <em>{timeAgo(c.commentTime)}</em>
              </p>
              <p className="mc_comment_text">{c.commentContent}</p>
              <p className="mc_comment_up">👍 {c.commentUp || 0}</p>
            </div>
          </li>
        ))}
        {list.length === 0 ? <li className="mc_comment_empty">还没有评论，来抢沙发吧～</li> : null}
      </ul>
    </div>
  );
}