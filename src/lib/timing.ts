import type { TimingTask } from "./extraSettings";

export const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function parseClock(value: string | undefined) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
  if (!match) return { hour: 0, minute: 0 };
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function normalizeWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((v) => Number.isInteger(v) && v >= 0 && v <= 6))].sort((a, b) => a - b);
}

export function isTimingDue(task: TimingTask, now = new Date()) {
  if (!task.enabled) return false;
  const schedule = task.schedule || "interval";
  if (schedule === "daily" || schedule === "weekly") {
    const weekdays = normalizeWeekdays(task.weekdays);
    if (schedule === "weekly" && !weekdays.includes(now.getDay())) return false;
    const { hour, minute } = parseClock(task.time);
    const scheduled = new Date(now);
    scheduled.setHours(hour, minute, 0, 0);
    return now.getTime() >= scheduled.getTime() && (task.lastRun || 0) * 1000 < scheduled.getTime();
  }
  return now.getTime() / 1000 - (task.lastRun || 0) >= Math.max(1, task.intervalMinutes || 60) * 60;
}

export function timingScheduleLabel(task: TimingTask) {
  const schedule = task.schedule || "interval";
  if (schedule === "daily") return `每天 ${task.time || "00:00"}`;
  if (schedule === "weekly") {
    const days = normalizeWeekdays(task.weekdays).map((d) => WEEKDAY_LABELS[d]).join("、");
    return `每周${days ? ` ${days}` : ""} ${task.time || "00:00"}`;
  }
  return `每 ${Math.max(1, task.intervalMinutes || 60)} 分钟`;
}

export function collectHoursForTask(task: TimingTask) {
  try {
    const params = task.params ? (JSON.parse(task.params) as { hours?: unknown }) : {};
    const explicit = Number(params.hours);
    if (Number.isFinite(explicit) && explicit > 0) return Math.min(720, Math.floor(explicit));
  } catch {}
  if (task.schedule === "daily") return 24;
  if (task.schedule === "weekly") return 168;
  return undefined;
}