# 苹果CMS v10 → TypeScript + Next.js 重构设计

日期：2026-11-21
状态：已按用户明确要求实施

## 意图与目标

把苹果CMS v10（PHP/ThinkPHP）整体重构为 TypeScript + Next.js 全栈应用，保持：

1. **功能复刻**：内容管理、采集、会员、评论、留言、积分/充值/提现、专题/演员/角色、搜索、RSS、对外数据接口等。
2. **后台模板**：NextAdminHQ/nextjs-admin-dashboard（Next 16 + React 19 + Tailwind v4）。
3. **前台模板**：792.zip 的 Conch 主题，静态资源原样沿用，ThinkPHP 模板标签改写为 React 组件。
4. **数据库**：MySQL 8.4（用户明确选择），表结构保持 `mac_` 前缀与字段命名。
5. **数据来源**：`https://lzizy.net/api.php/provide/vod/` 采集真实影视资源。

## 非目标 / 边界

- 不保留 PHP 运行时；不提供 PHP 模板引擎兼容层。
- 支付宝/微信真实支付、短信/邮件验证码、QQ/微信 OAuth 需要第三方密钥，当前提供演示支付与占位流程。
- 原「生成静态 HTML」在 Next.js 中以 SSR + 缓存刷新替代；定时任务、URL 推送由部署平台承担。

## 约束

- Windows 本地开发；MySQL 8.4 便携版，零系统安装。
- 播放源为资源站 m3u8，需要 HLS 播放；部分线路为分享页，使用 iframe 兜底。
- 长播放列表可能超过 TEXT 64KB，长文本列必须使用 MEDIUMTEXT。

## 方案比较

| 方案 | 取舍 |
|---|---|
| A. 保留 PHP 后台，仅前台 Next 化 | 不满足「全部重写」与 NextAdmin 后台要求，弃用 |
| B. Next.js 单体 + Prisma + MySQL（选中） | 一套 TypeScript 代码同时服务前台/后台；表结构与苹果CMS对齐；部署简单 |
| C. Next 前台 + 独立 NestJS API | 架构更重，单人项目收益低；与「Next.js 全栈」目标不符 |

**选择 B**：App Router + Server Components 直接查询 Prisma；路由处理器提供 REST API 与苹果CMS兼容接口。

## 关键决策

- **数据模型**：27 张 `mac_*` 表 + `mac_setting`（JSON 配置）。`vod_play_from/vod_play_url` 保持 `$$$`（线路）与 `#`（分集）格式。
- **认证**：HttpOnly JWT（`jose`），用户/管理员独立 Cookie；bcrypt 密码哈希。
- **后台 CRUD**：字段驱动配置（`adminResources.ts`）+ 统一资源 API，覆盖 20+ 模块。
- **采集**：实现苹果CMS v10 JSON 协议（`ac=list` / `ac=detail`），分类导入 + 按分类/页数采集，按 `vod_id` upsert 去重。
- **前台还原**：沿用 792 的 `mxstyle.css`、`hlstyle.css`、配色 CSS、iconfont；页面 class 与结构对齐原模板；缺失的模板标签以组件替代。
- **播放器**：`hls.js` 按需加载；非 m3u8 链接使用 iframe。
- **演示数据**：种子脚本采集 3 页 + 各分类 1 页，生成专题、资讯、演员、评论、会员、订单等。

## 交付物

- 可运行工程（`npm run dev` / `npm run build`）
- 初始化脚本（`scripts/mysql-start.bat`、`scripts/setup.bat`）
- 数据接口 `/api/provide/vod`
- 账号：admin/admin123、demo/demo123
- 说明文档 `README.md`

## 后续可扩展

- 真实支付网关、短信/邮件验证、OAuth 登录
- 分集剧情（vod_plot）编辑器与前台剧情页
- 广告位可视化管理（792 的 ads 插槽）
- 定时采集任务与 URL 主动推送