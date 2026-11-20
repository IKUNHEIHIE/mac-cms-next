import { prisma } from "../src/lib/db";

async function main() {
  const [total, withPlay, withPic, withName, stateRow, types] = await Promise.all([
    prisma.vod.count(),
    prisma.vod.count({ where: { NOT: { vodPlayUrl: "" } } }),
    prisma.vod.count({ where: { NOT: { vodPic: "" } } }),
    prisma.vod.count({ where: { NOT: { vodName: "" } } }),
    prisma.setting.findUnique({ where: { key: "collect_all_state" } }),
    prisma.vod.groupBy({ by: ["typeId"], _count: { _all: true }, orderBy: { _count: { typeId: "desc" } }, take: 10 }),
  ]);
  let state: Record<string, unknown> = {};
  try {
    state = stateRow ? JSON.parse(stateRow.value) : {};
  } catch {}
  const typeNames = await prisma.type.findMany({ select: { typeId: true, typeName: true } });
  const nameMap = new Map(typeNames.map((t) => [t.typeId, t.typeName]));
  console.log("== 数据校验 ==");
  console.log("影片总数:", total, "资源站总数:", state.total ?? "-");
  console.log("名称完整:", withName, "封面完整:", withPic, "播放地址完整:", withPlay);
  console.log("采集状态:", state.status ?? "-", "页进度:", `${state.pagesDone ?? "-"}/${state.pagecount ?? "-"}`, "失败页:", state.failedPages ?? 0);
  console.log("分类分布:");
  for (const t of types) console.log(`  ${nameMap.get(t.typeId) || t.typeId}: ${t._count._all}`);
  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
