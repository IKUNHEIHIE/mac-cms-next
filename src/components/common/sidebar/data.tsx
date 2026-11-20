import {
  AlphabetIcon,
  AuthIcon,
  CalendarIcon,
  ChatIcon,
  HomeIcon,
  InvoiceIcon,
  LetterIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
  UserGroupIcon,
  UserIcon,
  Widget4Icon,
} from "./icon";

export type NavChild = { title: string; url: string };
export type NavItem = { title: string; url?: string; icon: React.ReactElement; items: NavChild[] };
export type NavSection = { label: string; items: NavItem[] };

export const NAV_DATA: NavSection[] = [
  {
    label: "概览",
    items: [
      { title: "控制台", url: "/admin", icon: <HomeIcon />, items: [] },
      { title: "数据统计", url: "/admin/stats", icon: <PieChartIcon />, items: [] },
    ],
  },
  {
    label: "内容管理",
    items: [
      { title: "视频管理", url: "/admin/manage/vod", icon: <TableIcon />, items: [] },
      { title: "文章管理", url: "/admin/manage/art", icon: <LetterIcon />, items: [] },
      { title: "专题管理", url: "/admin/manage/topic", icon: <Widget4Icon />, items: [] },
      { title: "演员管理", url: "/admin/manage/actor", icon: <UserIcon />, items: [] },
      { title: "角色管理", url: "/admin/manage/role", icon: <AuthIcon />, items: [] },
      { title: "漫画管理", url: "/admin/manage/manga", icon: <TaskIcon />, items: [] },
      { title: "网站导航", url: "/admin/manage/website", icon: <CalendarIcon />, items: [] },
    ],
  },
  {
    label: "分类与会员",
    items: [
      { title: "分类管理", url: "/admin/manage/type", icon: <AlphabetIcon />, items: [] },
      { title: "会员组", url: "/admin/manage/group", icon: <UserGroupIcon />, items: [] },
      { title: "会员管理", url: "/admin/manage/user", icon: <UserIcon />, items: [] },
      { title: "订单管理", url: "/admin/manage/order", icon: <InvoiceIcon />, items: [] },
      { title: "充值卡", url: "/admin/manage/card", icon: <TaskIcon />, items: [] },
      { title: "提现审核", url: "/admin/manage/cash", icon: <InvoiceIcon />, items: [] },
      { title: "积分日志", url: "/admin/manage/plog", icon: <LetterIcon />, items: [] },
    ],
  },
  {
    label: "互动管理",
    items: [
      { title: "评论管理", url: "/admin/manage/comment", icon: <ChatIcon />, items: [] },
      { title: "留言管理", url: "/admin/manage/gbook", icon: <ChatIcon />, items: [] },
      { title: "站内消息", url: "/admin/manage/msg", icon: <ChatIcon />, items: [] },
      { title: "友情链接", url: "/admin/manage/link", icon: <Widget4Icon />, items: [] },
    ],
  },
  {
    label: "运营工具",
    items: [
      { title: "广告管理", url: "/admin/ads", icon: <Widget4Icon />, items: [] },
      { title: "播放器配置", url: "/admin/player", icon: <TaskIcon />, items: [] },
      { title: "安全设置", url: "/admin/safety", icon: <AuthIcon />, items: [] },
      { title: "定时任务", url: "/admin/timming", icon: <CalendarIcon />, items: [] },
      { title: "URL 推送", url: "/admin/urlsend", icon: <PieChartIcon />, items: [] },
      { title: "媒体库", url: "/admin/images", icon: <LetterIcon />, items: [] },
      { title: "域名设置", url: "/admin/domain", icon: <CalendarIcon />, items: [] },
    ],
  },
  {
    label: "采集与系统",
    items: [
      { title: "资源采集", url: "/admin/collect", icon: <TaskIcon />, items: [] },
      { title: "全量采集", url: "/admin/collect-all", icon: <PieChartIcon />, items: [] },
      { title: "采集节点", url: "/admin/manage/collect", icon: <TaskIcon />, items: [] },
      { title: "文章采集", url: "/admin/cjrun", icon: <TaskIcon />, items: [] },
      { title: "文章采集节点", url: "/admin/manage/cjnode", icon: <LetterIcon />, items: [] },
      { title: "系统设置", url: "/admin/setting", icon: <AuthIcon />, items: [] },
      { title: "数据库", url: "/admin/database", icon: <PieChartIcon />, items: [] },
      { title: "模板管理", url: "/admin/template", icon: <Widget4Icon />, items: [] },
      { title: "文件上传", url: "/admin/upload", icon: <LetterIcon />, items: [] },
      { title: "缓存刷新", url: "/admin/make", icon: <TaskIcon />, items: [] },
      { title: "系统信息", url: "/admin/update", icon: <CalendarIcon />, items: [] },
      { title: "管理员", url: "/admin/manage/admin", icon: <UserGroupIcon />, items: [] },
      { title: "访问日志", url: "/admin/manage/visit", icon: <CalendarIcon />, items: [] },
      { title: "播放日志", url: "/admin/manage/ulog", icon: <TableIcon />, items: [] },
      { title: "附件管理", url: "/admin/manage/annex", icon: <LetterIcon />, items: [] },
    ],
  },
];