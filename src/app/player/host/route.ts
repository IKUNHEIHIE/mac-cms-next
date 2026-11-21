export const dynamic = "force-dynamic";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  if (request.headers.get("sec-fetch-dest") === "document") {
    return new Response("请通过播放页打开播放器", { status: 403 });
  }
  const url = new URL(request.url);
  const file = url.searchParams.get("file") || "";
  if (!/^\/media\/players\/[A-Za-z0-9._-]+$/.test(file)) {
    return new Response("播放器文件无效", { status: 400 });
  }
  const config = {
    url: url.searchParams.get("url") || "",
    poster: url.searchParams.get("poster") || "",
    title: url.searchParams.get("title") || "",
    from: url.searchParams.get("from") || "",
  };
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(config.title || "播放器")}</title>
<style>
  html,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif}
  #player-container,#MacPlayer{width:100%;height:100%}
  .ph{display:flex;height:100%;align-items:center;justify-content:center;color:#aaa;font-size:14px;text-align:center;padding:24px}
</style>
</head>
<body>
<div id="player-container"></div>
<div id="MacPlayer"></div>
<div id="player-fallback" class="ph" style="display:none">播放器未渲染，请检查上传的 JS 播放器是否使用 window.MAC_PLAYER 配置。</div>
<script>
window.MAC_PLAYER = ${JSON.stringify(config).replace(/</g, "\u003c").replace(/>/g, "\u003e")};
window.MacPlayer = window.MacPlayer || { Html: "", Show: function(){}, Play: function(){} };
</script>
<script src="${esc(file)}"></script>
<script>
  setTimeout(function(){
    var a=document.getElementById('player-container');
    var b=document.getElementById('MacPlayer');
    if(!a.children.length && !b.children.length){document.getElementById('player-fallback').style.display='flex';}
  }, 2500);
</script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox allow-scripts allow-popups allow-presentation",
    },
  });
}