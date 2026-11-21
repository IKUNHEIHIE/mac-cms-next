import { spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";
import { prisma } from "./db";

export const COLLECT_STATE_KEY = "collect_all_state";

export type CollectState = {
  status?: string;
  nextPage?: number;
  pagecount?: number;
  total?: number;
  pagesDone?: number;
  imported?: number;
  skipped?: number;
  failedPages?: number[];
  updatedAt?: number;
  startedAt?: number;
  lastError?: string;
  pid?: number;
  rate?: { interval?: number };
};

export async function getCollectState(): Promise<CollectState | null> {
  const row = await prisma.setting.findUnique({ where: { key: COLLECT_STATE_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as CollectState;
  } catch {
    return null;
  }
}

async function saveCollectState(state: CollectState) {
  state.updatedAt = Math.floor(Date.now() / 1000);
  await prisma.setting.upsert({
    where: { key: COLLECT_STATE_KEY },
    update: { value: JSON.stringify(state) },
    create: { key: COLLECT_STATE_KEY, value: JSON.stringify(state) },
  });
}

export function isPidAlive(pid?: number) {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

export async function startCollector(fresh = false) {
  const state = await getCollectState();
  if (state && isPidAlive(state.pid)) {
    return { ok: false, msg: `采集已在运行（PID ${state.pid}）` };
  }
  if (!fresh && state?.status === "done") {
    return { ok: false, msg: "全量采集已完成；如需重新采集请使用“重新采集”" };
  }
  const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(tsxCli)) return { ok: false, msg: "未找到 tsx 运行器，请先执行 npm install" };
  const logDir = path.join(process.cwd(), "_logs");
  mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, "collect-all.log");
  const args = [tsxCli, "scripts/collect-all.ts"];
  if (fresh) args.push("--fresh");
  const fd = openSync(logFile, "a");
  try {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      detached: true,
      stdio: ["ignore", fd, fd],
      windowsHide: true,
      env: process.env,
    });
    child.unref();
    if (state) {
      state.status = "running";
      state.pid = child.pid;
      await saveCollectState(state);
    }
    return { ok: true, msg: fresh ? "已启动重新采集" : "已启动断点续采", pid: child.pid };
  } catch (e) {
    return { ok: false, msg: e instanceof Error ? e.message : "启动失败" };
  } finally {
    closeSync(fd);
  }
}

export async function pauseCollector() {
  const state = await getCollectState();
  const pid = state?.pid;
  if (pid && isPidAlive(pid)) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true });
    } else {
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
        try {
          process.kill(pid, "SIGTERM");
        } catch {}
      }
    }
  }
  if (state) {
    state.status = "paused";
    state.pid = 0;
    await saveCollectState(state);
  }
  return { ok: true, msg: "采集已暂停，进度已保留" };
}