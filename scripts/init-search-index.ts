import { ensureVodSearchIndex, rebuildVodSearchIndex } from "../src/lib/searchIndex";
import { prisma } from "../src/lib/db";

async function main() {
  await ensureVodSearchIndex();
  await rebuildVodSearchIndex();
  const [count] = await prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*) AS c FROM mac_vod_search_idx`;
  console.log(`搜索索引已就绪：${Number(count?.c || 0)} 条`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});