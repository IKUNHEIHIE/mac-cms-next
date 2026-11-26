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

export async function getCollectState(nodeId?: number): Promise<CollectState | null> {
  const row = await prisma.setting.findUnique({ where: { key: stateKey(nodeId) } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as CollectState;
  } catch {
    return null;
  }
}

function stateKey(nodeId?: number) {
  return nodeId ? `${COLLECT_STATE_KEY}_node_${nodeId}` : COLLECT_STATE_KEY;
}

async function saveCollectState(state: CollectState, nodeId?: number) {
  state.updatedAt = Math.floor(Date.now() / 1000);
  const key = stateKey(nodeId);
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(state) },
    create: { key, value: JSON.stringify(state) },
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

async function activeCollectorCount() {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: COLLECT_STATE_KEY } },
    select: { value: true },
  });
  let count = 0;
  for (const row of rows) {
    try {
      const state = JSON.parse(row.value) as CollectState;
      if (isPidAlive(state.pid)) count++;
    } catch {}
  }
  return count;
}

let startChain: Promise<unknown> = Promise.resolve();

function withStartLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = startChain;
  let release!: () => void;
  startChain = new Promise<void>((resolve) => {
    release = resolve;
  });
  return previous.then(task).finally(release) as Promise<T>;
}

export function startCollector(
  fresh = false,
  options: { nodeId?: number; api?: string; format?: string; name?: string } = {},
) {
  return withStartLock(() => startCollectorInner(fresh, options));
}

async function startCollectorInner(
  fresh: boolean,
  options: { nodeId?: number; api?: string; format?: string; name?: string },
) {
  const state = await getCollectState(options.nodeId);
  if (state && isPidAlive(state.pid)) {
    return { ok: false, msg: `采集已在运行（PID ${state.pid}）` };
  }
  if (!fresh && state?.status === "done") {
    return { ok: false, msg: "全量采集已完成；如需重新采集请使用“重新采集”" };
  }
  const maxParallel = Math.max(1, Math.min(10, Number(process.env.COLLECT_MAX_PARALLEL) || 2));
  const active = await activeCollectorCount();
  if (active >= maxParallel) {
    return { ok: false, msg: `当前已有 ${active} 个采集任务并行运行（上限 ${maxParallel}），请等待完成后再启动` };
  }
  const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(tsxCli)) return { ok: false, msg: "未找到 tsx 运行器，请先执行 npm install" };
  const logDir = path.join(process.cwd(), "_logs");
  mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, options.nodeId ? `collect-all-node-${options.nodeId}.log` : "collect-all.log");
  const args = [tsxCli, "scripts/collect-all.ts"];
  if (fresh) args.push("--fresh");
  if (options.nodeId) {
    args.push("--node-id", String(options.nodeId), "--state-key", stateKey(options.nodeId));
    if (options.api) args.push("--api", options.api);
    if (options.format) args.push("--format", options.format);
    if (options.name) args.push("--name", options.name);
  }
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
      await saveCollectState(state, options.nodeId);
    }
    return { ok: true, msg: fresh ? "已启动重新采集" : "已启动断点续采", pid: child.pid };
  } catch (e) {
    return { ok: false, msg: e instanceof Error ? e.message : "启动失败" };
  } finally {
    closeSync(fd);
  }
}

export async function pauseCollector(nodeId?: number) {
  const state = await getCollectState(nodeId);
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
    await saveCollectState(state, nodeId);
  }
  return { ok: true, msg: "采集已暂停，进度已保留" };
}