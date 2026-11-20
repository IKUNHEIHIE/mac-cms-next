"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import type { PlaySource } from "@/lib/maccms";

export default function SourceTabs({
  vodId,
  sources,
  sid,
  nid,
}: {
  vodId: number;
  sources: PlaySource[];
  sid?: number;
  nid?: number;
}) {
  const initial = Math.max(0, sources.findIndex((s) => s.sid === sid));
  const [active, setActive] = useState(initial < 0 ? 0 : initial);
  const [expanded, setExpanded] = useState(false);

  if (!sources.length) {
    return <div className="play_tips" style={{ position: "static", padding: "0.5rem" }}><h3>暂无播放地址</h3></div>;
  }
  const cur = sources[active];

  return (
    <div className="play_source">
      <div className="play_source_tab list_scroll clearfix" id="NumTab">
        {sources.map((s, i) => (
          <a
            key={s.sid}
            href="javascript:void(0)"
            className={i === active ? "active" : ""}
            onClick={() => setActive(i)}
          >
            <Icon code={0xe62f} />
            &nbsp;{s.show}
          </a>
        ))}
      </div>
      <div className="play_list_box show">
        <div className="player_infotip">
          <Icon code={0xe62d} />
          &nbsp;当前资源由{cur.show}提供&nbsp;-&nbsp;在线播放,无需安装播放器
        </div>
        <div className="playlist_notfull">
          <ul className="content_playlist list_scroll clearfix">
            {cur.urls.slice(0, expanded ? cur.urls.length : 40).map((u) => (
              <li
                key={u.nid}
                className={sid === cur.sid && nid === u.nid ? "active" : undefined}
              >
                <Link href={`/vod/play/${vodId}/${cur.sid}/${u.nid}`}>{u.name}</Link>
              </li>
            ))}
          </ul>
          {cur.urls.length > 40 ? (
            <a href="javascript:void(0)" onClick={() => setExpanded(!expanded)} className="listshow hidden_xs">
              <span>
                <Icon code={expanded ? 0xe628 : 0xe63a} />
                &nbsp;{expanded ? "收起全部" : "展开全部"}
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}