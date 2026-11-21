# MAC CMS · TypeScript + Next.js 重构版

将苹果CMS v10（maccms10-2025.1000.4052）重构为 TypeScript + Next.js 全栈应用：

- **前台**：792.zip 的 Conch 影视主题（CSS / 字体 / 图标原样沿用），模板语法改写为 React Server Components。
- **后台**：NextAdminHQ/nextjs-admin-dashboard v2（Next.js 16 + React 19 + Tailwind v4）。
- **数据库**：MySQL 8.4（Prisma ORM），表名保持 `mac_` 前缀，字段与苹果CMS一致。
- **数据**：从资源站 `https://lzizy.net/api.php/provide/vod/` 采集的真实影视数据。

## 快速启动

### 1. 启动 MySQL 8.4（便携版）

本项目自带便携版 MySQL 8.4.7（`_tools/mysql-8.4.7-winx64`，数据目录 `_tools/mysql-data`）。

```bat
scripts\mysql-start.bat
```

首次使用或数据目录丢失时初始化：

```bat
_tools\mysql-8.4.7-winx64\bin\mysqld.exe --initialize-insecure --basedir="%CD%\_tools\mysql-8.4.7-winx64" --datadir="%CD%\_tools\mysql-data"
_tools\mysql-8.4.7-winx64\bin\mysql.exe -uroot -h127.0.0.1 -P3306 -e "CREATE DATABASE IF NOT EXISTS maccms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. 安装依赖并初始化数据

```bash
npm install
npx prisma db push
npx prisma db seed     # 导入分类 + 从 lzizy 采集影片（含电影/综艺/动漫等分类）+ 演示会员/专题/文章
```

`.env`：

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/maccms"
AUTH_SECRET="请替换为随机长字符串"
CRON_SECRET="供外部 Cron 调用 /api/cron 使用的随机串"
```

### 3. 启动

```bash
npm run dev      # http://localhost:3000
npm run build && npm start
```

## 默认账号

| 端 | 地址 | 账号 | 密码 |
|---|---|---|---|
| 后台 | `/admin` | admin | admin123 |
| 前台会员 | `/user/login` | demo | demo123 |

> 上线前必须修改默认密码与 `AUTH_SECRET`。

## 功能清单

### 前台（792 Conch）
- 首页：轮播推荐、热播、分类区块、影视资讯、友情链接、公告
- 视频：分类列表（筛选/排序/分页）、详情、播放（HLS/m3u8、外链 iframe）、下载页
- 搜索：关键词 + 分类/地区/年份筛选
- 文章：分类列表、详情
- 专题、演员、角色、网址导航、漫画、排行榜、最新更新、留言板、RSS、免责声明
- 会员中心：登录/注册/找回密码、资料修改、收藏、观看历史、下载、权限
- 评论、观看历史自动记录
- 苹果CMS v10 兼容数据接口：`/api/provide/vod`（`ac=list` / `ac=detail`，支持 `t/pg/wd/ids/limit`；`/api.php/provide/vod` 亦可）

### 后台（NextAdmin）
- 控制台、数据统计（14 天趋势）
- 内容：视频、文章、专题、演员、角色、漫画、网站导航
- 分类：分类（含筛选 JSON）、会员组
- 会员：会员、会员组
- 互动：评论、留言、站内消息、友情链接
- 采集：资源采集（分类导入、按分类/页数采集、自动更新）、采集节点、文章采集（正则规则抓取，MD5 去重）
- 已移除：订单、充值卡、提现、积分日志、积分购买、在线充值、邀请奖励、VIP 升级及全部积分/支付能力（后台与会员端）。
- 运营工具：广告位（首页/列表/搜索/详情右侧/播放页）、播放器线路名称、IP 黑名单、登录验证码、定时任务、百度 URL 推送、媒体库、域名记录
- 系统：站点/主题设置、数据库概况 / JSON 导出 / JSON 导入、管理员、访问日志、播放日志、附件、模板对照、文件上传、缓存刷新、系统信息
- 全量 CRUD 由统一资源接口 `/api/admin/resource/[resource]` 提供，字段白名单、Int 类型转换与状态联动在 `src/lib/adminResources.ts` / `src/app/api/admin/resource/[resource]/route.ts`

### 定时任务与 URL 推送

```bash
# 外部 Cron 调用（设置 CRON_SECRET 后可免登录）
curl -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron
curl -X POST -H "x-cron-secret: $CRON_SECRET" "http://localhost:3000/api/cron?force=1"
```

任务在后台「运营工具 → 定时任务」中以 JSON 维护，支持 `collect`、`revalidate`、`resetHits`。
百度 URL 推送在「运营工具 → URL 推送」配置 Token 后手动推送最新 20 条。

上传文件保存在 `public/uploads/`，通过 `/media/...` 路由读取（生产模式同样即时可访问）。

## 目录结构

```
prisma/
  schema.prisma        # 23 张 mac_* 业务表 + 设置表
  seed.ts              # 初始化 + 资源站采集
public/theme/conch/    # 792 主题静态资源（css/js/fonts/img）
src/app/(site)/        # 前台路由（792 主题）
src/app/(member)/      # 会员中心（member.conch.css）
src/app/admin/         # NextAdmin 后台
src/app/api/           # 用户/后台/评论/采集/对外接口
src/components/site/   # 前台组件（卡片、播放器、评论等）
src/components/admin/  # 后台表单/上传/采集组件
src/lib/               # db、auth、设置、采集、MACCMS 工具
```

## 重构说明

- 苹果CMS 模板标签 `{maccms:vod}`、`{maccms:type}`、`{:mac_url_*}` 等，替换为 Prisma 查询与 `src/lib/maccms.ts` 链接/解析函数。
- `vod_play_from` / `vod_play_url` 的多线路 `$$$`、分集 `#`、`集名$地址` 格式保持不变，可直接使用资源站数据。
- 原 PHP 会话认证改为 HttpOnly JWT Cookie（`jose`），密码使用 bcrypt 哈希。
- 长文本字段使用 `MEDIUMTEXT`，避免综艺/短剧超长播放列表被截断。
- 设计文档：`docs/superpowers/specs/2026-11-21-maccms-nextjs-design.md`
## 与苹果CMS的差异（架构替代 / 外部依赖）

- **QQ/微信 OAuth、短信/邮件验证码**：需要第三方 AppID/SMTP 凭据；项目已不包含任何支付或积分能力。
- **插件市场（Addon）**：Next.js 以模块化路由与组件扩展替代，业务插件作为独立模块接入。
- **静态 HTML 生成**：以 SSR + 「缓存刷新」替代逐页生成，后台「缓存与生成」提供一键刷新。
- **定时任务 / URL 推送**：已实现 `/api/cron` 与百度主动推送，可通过系统 Cron 或部署平台触发。


## 量子资源站全量采集

```bash
npx tsx scripts/collect-all.ts --fresh   # 从第 1 页开始
npx tsx scripts/collect-all.ts           # 断点续采
npx tsx scripts/collect-all.ts --from 41 # 回补指定页之后
```

- 每页 20 条，全站约 8,234 页 / 16.4 万条；单线程自适应限速（1.2s–8s），触发 429 自动冷却 60 秒。
- 进度写入 `mac_setting.collect_all_state`，后台「采集与系统 → 全量采集」可实时查看进度、入库数、失败页与预计剩余时间。
- 采集完成后执行 `npx tsx scripts/verify-data.ts` 核对总数、缺失字段与分类分布。


## 安全加固

- **密钥**：`AUTH_SECRET` 必须为随机长字符串；生产环境缺失或过弱会直接拒绝启动。HTTPS 部署时设置 `COOKIE_SECURE=1`。
- **后台账号**：默认 `admin/admin123` 仅用于本地初始化，控制台会持续提示修改；登录接口按 IP + 账号双维度限速。
- **上传与播放器**：文件名随机化；HTML/SVG 直接访问强制下载，iframe 播放器使用无 `allow-same-origin` 的 sandbox；JS 播放器仅在沙箱宿主页运行。仅上传可信播放器文件。
- **SSRF**：采集接口、文章采集、播放器线路探测统一校验 http/https，并拒绝回环、内网、链路本地与保留地址；重定向逐跳校验。
- **XSS**：文章/专题/演员/角色/网址正文统一经过 `sanitize-html` 清洗后再渲染；上传播放器与媒体响应附加 CSP/沙箱与 `nosniff`。
- **安全响应头**：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`、基础 CSP。
- **数据库**：便携 MySQL 仅监听 127.0.0.1；生产环境请设置 root 密码、限制网络访问并定期备份。
