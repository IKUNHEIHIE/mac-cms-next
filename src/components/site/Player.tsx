"use client";

import { useEffect, useRef, useState } from "react";

export type CustomPlayer = { file: string; kind: "html" | "js"; name?: string };

export default function Player({
  src,
  poster,
  title,
  from,
  custom,
}: {
  src: string;
  poster?: string;
  title?: string;
  from?: string;
  custom?: CustomPlayer;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setError("");
    const isHls = /\.m3u8(\?|$)/i.test(src);
    let destroy: (() => void) | undefined;

    if (isHls && !video.canPlayType("application/vnd.apple.mpegurl")) {
      let cancelled = false;
      import("hls.js")
        .then(({ default: Hls }) => {
          if (cancelled) return;
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (_e, data) => {
              if (data.fatal) setError("视频加载失败，请切换线路或稍后重试");
            });
            destroy = () => hls.destroy();
          } else {
            video.src = src;
          }
        })
        .catch(() => setError("播放器加载失败"));
      return () => {
        cancelled = true;
        destroy?.();
      };
    }
    video.src = src;
    return () => {
      video.removeAttribute("src");
    };
  }, [src]);

  if (!src) {
    return (
      <div className="play_tips">
        <h3>抱歉，暂无播放地址</h3>
      </div>
    );
  }

  if (custom) {
    const qs = new URLSearchParams({ url: src, poster: poster || "", title: title || "", from: from || "" });
    const iframeSrc =
      custom.kind === "js"
        ? `/player/host?${new URLSearchParams({ file: custom.file, ...Object.fromEntries(qs) }).toString()}`
        : `${custom.file}${custom.file.includes("?") ? "&" : "?"}${qs.toString()}`;
    return (
      <div className="MacPlayer">
        <iframe
          src={iframeSrc}
          title={title || "播放器"}
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-popups allow-presentation"
          style={{ border: 0, width: "100%", height: "100%", position: "absolute", inset: 0 }}
        />
      </div>
    );
  }

  if (!/\.(m3u8|mp4|webm|ogg)(\?|$)/i.test(src) && /^https?:/i.test(src)) {
    return (
      <div className="MacPlayer">
        <iframe
          src={src}
          title={title}
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          style={{ border: 0, width: "100%", height: "100%", position: "absolute", inset: 0 }}
        />
      </div>
    );
  }

  return (
    <div className="MacPlayer">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        preload="metadata"
        poster={poster}
        title={title}
        style={{ width: "100%", height: "100%", background: "#000", display: "block" }}
      />
      {error ? <div className="play_tips"><h3>{error}</h3></div> : null}
    </div>
  );
}