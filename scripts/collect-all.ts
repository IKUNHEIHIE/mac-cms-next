import { prisma } from "../src/lib/db";
import { mapLzVod, importTypes, LZ_API, getCollectBindings } from "../src/lib/collect";

const STATE_KEY = "collect_all_state";
const MIN_INTERVAL = 1200;
const START_INTERVAL = 2000;
const MAX_INTERVAL = 8000;
const MAX_ATTEMPTS = 10;

type State = {
  status: "running" | "paused" | "done" | "done-with-errors";
  nextPage: number;
  pagecount: number;
  total: number;
  pagesDone: number;
  imported: number;
  skipped: number;
  failedPages: number[];
  startedAt: number;
  updatedAt: number;
  lastError?: string;
  pid?: number;
  rate?: { interval: number; last429: number };
};

const startedAt = Math.floor(Date.now() / 1000);
let stopping = false;
let interval = START_INTERVAL;
let lastRequestAt = 0;
let cooldownUntil = 0;
let successes = 0;
let consecutive429 = 0;

function log(msg: string) {
  const t = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  console.log(`[${t}] ${msg}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function saveState(state: State) {
  state.updatedAt = Math.floor(Date.now() / 1000);
  state.rate = { interval, last429: consecutive429 };
  await prisma.setting.upsert({
    where: { key: STATE_KEY },
    update: { value: JSON.stringify(state) },
    create: { key: STATE_KEY, value: JSON.stringify(state) },
  });
}

async function loadState(): Promise<State | null> {
  const row = await prisma.setting.findUnique({ where: { key: STATE_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as State;
  } catch {
    return null;
  }
}

async function waitSpacing() {
  const now = Date.now();
  if (now < cooldownUntil) {
    const rest = cooldownUntil - now;
    log(`限流冷却中，等待 ${Math.ceil(rest / 1000)}s`);
    await sleep(rest);
  }
  const target = lastRequestAt + interval + Math.floor(Math.random() * 200);
  const wait = target - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

type LzVod = Record<string, string | number | undefined>;

async function fetchPage(page: number): Promise<{ list: LzVod[]; pagecount: number; total: number }> {
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await waitSpacing();
    try {
      const res = await fetch(`${LZ_API}?ac=detail&pg=${page}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          Accept: "application/json,text/plain,*/*",
          Referer: "https://lzizy.net/",
        },
        signal: AbortSignal.timeout(35000),
      });
      if (res.status === 429) {
        consecutive429++;
        const retryAfter = Number(res.headers.get("retry-after")) || 0;
        const cooldown = Math.max(60000, retryAfter * 1000) * (consecutive429 >= 3 ? 2 : 1);
        cooldownUntil = Date.now() + cooldown;
        interval = Math.min(MAX_INTERVAL, Math.round(interval * 1.5));
        lastErr = "HTTP 429";
        log(`page ${page} 被限流，冷却 ${Math.round(cooldown / 1000)}s，间隔调整为 ${interval}ms`);
        continue;
      }
      if (res.status === 403 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { code?: number; list?: LzVod[]; pagecount?: number; total?: number };
      if (data.code !== 1 || !Array.isArray(data.list)) throw new Error("返回数据无效");
      consecutive429 = 0;
      successes++;
      if (successes % 25 === 0 && interval > MIN_INTERVAL) {
        interval = Math.max(MIN_INTERVAL, interval - 100);
        log(`连续成功 ${successes} 页，间隔降至 ${interval}ms`);
      }
      return { list: data.list, pagecount: Number(data.pagecount) || 0, total: Number(data.total) || 0 };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (attempt < MAX_ATTEMPTS) {
        const wait = Math.min(30000, attempt * 2000);
        log(`page ${page} 第 ${attempt} 次失败（${lastErr}），${wait}ms 后重试`);
        await sleep(wait);
      }
    }
  }
  throw new Error(`page ${page}: ${lastErr}`);
}

async function insertPage(list: LzVod[], parent: Record<number, number>, bindings: Record<number, number>) {
  const rows = list
    .map((v) => {
      try {
        return mapLzVod(v, parent, { bindings });
      } catch {
        return null;
      }
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  if (!rows.length) return { created: 0, dup: 0 };
  try {
    const r = await prisma.vod.createMany({ data: rows, skipDuplicates: true });
    return { created: r.count, dup: rows.length - r.count };
  } catch (e) {
    let created = 0;
    for (const row of rows) {
      try {
        await prisma.vod.create({ data: row });
        created++;
      } catch {}
    }
    log(`整页写入失败，逐条回退：${e instanceof Error ? e.message.slice(0, 120) : e}`);
    return { created, dup: rows.length - created };
  }
}

async function main() {
  log("启动全量采集（单线程自适应限速）…");
  await importTypes(LZ_API);
  const types = await prisma.type.findMany({ select: { typeId: true, typePid: true } });
  const parent: Record<number, number> = {};
  for (const t of types) parent[t.typeId] = t.typePid;
  const bindings = await getCollectBindings(LZ_API);

  const before = await prisma.vod.count();
  const prev = await loadState();
  const fresh = process.argv.includes("--fresh");
  const fromArg = process.argv.indexOf("--from");
  const fromPage = fromArg > 0 ? Number(process.argv[fromArg + 1]) : 0;

  let state: State;
  if (!fresh && prev && (prev.status === "running" || prev.status === "paused" || prev.status === "done-with-errors")) {
    state = { ...prev, status: "running", failedPages: prev.failedPages || [] };
    if (fromPage > 0) {
      state.nextPage = fromPage;
      state.pagesDone = fromPage - 1;
    }
    if (prev.rate?.interval) interval = Math.max(MIN_INTERVAL, prev.rate.interval);
    log(`断点续采：从第 ${state.nextPage} 页继续（已入库 ${state.imported}，间隔 ${interval}ms）`);
  } else {
    const probe = await fetchPage(1);
    state = {
      status: "running",
      nextPage: 1,
      pagecount: probe.pagecount,
      total: probe.total,
      pagesDone: 0,
      imported: 0,
      skipped: 0,
      failedPages: [],
      startedAt,
      updatedAt: startedAt,
    };
    log(`资源站共 ${state.pagecount} 页 / ${state.total} 条，现有影片 ${before} 条`);
  }
  state.pid = process.pid;
  await saveState(state);

  const onStop = async () => {
    stopping = true;
    state.status = "paused";
    state.pid = 0;
    await saveState(state);
    log(`收到停止信号，已保存断点：第 ${state.nextPage} 页`);
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", onStop);
  process.on("SIGTERM", onStop);

  let page = state.nextPage;
  let lastLogPage = 0;
  while (page <= state.pagecount && !stopping) {
    try {
      const data = await fetchPage(page);
      const ins = await insertPage(data.list, parent, bindings);
      state.imported += ins.created;
      state.skipped += ins.dup;
      state.pagesDone++;
      if (data.pagecount > state.pagecount) state.pagecount = data.pagecount;
      if (data.total > state.total) state.total = data.total;
    } catch (e) {
      state.failedPages.push(page);
      state.lastError = String(e).slice(0, 300);
      log(`page ${page} 最终失败，稍后统一重试`);
    }
    page++;
    state.nextPage = page;
    await saveState(state);
    if (state.pagesDone - lastLogPage >= 50) {
      lastLogPage = state.pagesDone;
      const pct = ((state.pagesDone / state.pagecount) * 100).toFixed(1);
      log(
        `进度 ${state.pagesDone}/${state.pagecount}（${pct}%）入库 ${state.imported} 重复 ${state.skipped} 失败 ${state.failedPages.length} 间隔 ${interval}ms`,
      );
    }
  }

  for (let round = 1; round <= 4 && state.failedPages.length > 0 && !stopping; round++) {
    const pending = [...new Set(state.failedPages)];
    log(`第 ${round} 轮重试 ${pending.length} 个失败页`);
    state.failedPages = [];
    for (const p of pending) {
      if (stopping) break;
      try {
        const data = await fetchPage(p);
        const ins = await insertPage(data.list, parent, bindings);
        state.imported += ins.created;
        state.skipped += ins.dup;
        state.pagesDone++;
      } catch {
        state.failedPages.push(p);
      }
      await saveState(state);
    }
  }

  state.status = state.failedPages.length ? "done-with-errors" : "done";
  state.nextPage = state.pagecount + 1;
  state.pid = 0;
  await saveState(state);
  const after = await prisma.vod.count();
  const elapsed = Math.floor((Date.now() / 1000 - startedAt) / 60);
  log(
    `采集结束：入库 ${state.imported}，重复 ${state.skipped}，失败页 ${state.failedPages.length}，影片总数 ${before} → ${after}，用时约 ${elapsed} 分钟`,
  );
  if (state.failedPages.length) log(`失败页：${state.failedPages.slice(0, 100).join(",")}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("全量采集异常：", e);
  try {
    const st = await loadState();
    if (st) {
      st.status = "paused";
      st.pid = 0;
      st.lastError = e instanceof Error ? e.message : String(e);
      await saveState(st);
    }
  } catch {}
  await prisma.$disconnect();
  process.exit(1);
});