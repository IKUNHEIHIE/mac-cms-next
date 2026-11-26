import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { withRedisLock } from "./redis";

const HAY_SQL = Prisma.sql`LOWER(CONCAT_WS(CHAR(1), COALESCE(vod_name,''), COALESCE(vod_actor,''), COALESCE(vod_director,''), COALESCE(vod_blurb,'')))`;
const META_SQL = Prisma.sql`LOWER(CONCAT_WS(CHAR(1), COALESCE(vod_class,''), COALESCE(vod_area,''), COALESCE(vod_year,'')))`;

export async function syncVodSearchIds(ids: number[]) {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  if (!unique.length) return;
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO mac_vod_search_idx (vod_id, vod_status, vod_time, hay, meta)
      SELECT vod_id, vod_status, vod_time, ${HAY_SQL}, ${META_SQL}
      FROM mac_vod WHERE vod_id IN (${Prisma.join(unique)})
      ON DUPLICATE KEY UPDATE vod_status=VALUES(vod_status), vod_time=VALUES(vod_time), hay=VALUES(hay), meta=VALUES(meta)`,
  );
}

export async function removeVodSearchIds(ids: number[]) {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  if (!unique.length) return;
  await prisma.$executeRaw(Prisma.sql`DELETE FROM mac_vod_search_idx WHERE vod_id IN (${Prisma.join(unique)})`);
}

export async function rebuildVodSearchIndex() {
  return withRedisLock("mac:cms:search-rebuild-lock", 600, async () => {
    await prisma.$executeRaw`DELETE FROM mac_vod_search_idx`;
    await prisma.$executeRaw`INSERT INTO mac_vod_search_idx (vod_id, vod_status, vod_time, hay, meta)
      SELECT vod_id, vod_status, vod_time,
        LOWER(CONCAT_WS(CHAR(1), COALESCE(vod_name,''), COALESCE(vod_actor,''), COALESCE(vod_director,''), COALESCE(vod_blurb,''))),
        LOWER(CONCAT_WS(CHAR(1), COALESCE(vod_class,''), COALESCE(vod_area,''), COALESCE(vod_year,'')))
      FROM mac_vod`;
  });
}

export async function searchActorVodIds(name: string, take: number): Promise<number[]> {
  const q = name.trim().toLowerCase();
  if (!q) return [];
  const rows =
    q.length >= 2
      ? await prisma.$queryRaw<{ vod_id: number }[]>(
          Prisma.sql`SELECT x.vod_id FROM (
              SELECT s.vod_id, s.vod_time FROM mac_vod_search_idx s
              WHERE s.vod_status = 1
                AND MATCH(s.hay) AGAINST (${q} IN NATURAL LANGUAGE MODE)
                AND s.hay LIKE ${like(q)}
            ) x
            JOIN mac_vod v ON v.vod_id = x.vod_id
            WHERE v.vod_actor LIKE ${like(q)}
            ORDER BY x.vod_time DESC LIMIT ${take}`,
        )
      : await prisma.$queryRaw<{ vod_id: number }[]>(
          Prisma.sql`SELECT s.vod_id FROM mac_vod_search_idx s
            JOIN mac_vod v ON v.vod_id = s.vod_id
            WHERE s.vod_status = 1 AND s.hay LIKE ${like(q)}
              AND v.vod_actor LIKE ${like(q)}
            ORDER BY s.vod_time DESC LIMIT ${take}`,
        );
  return rows.map((r) => Number(r.vod_id));
}

export async function ensureVodSearchIndex() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS mac_vod_search_idx (
    vod_id INT NOT NULL,
    vod_status INT NOT NULL DEFAULT 0,
    vod_time INT NOT NULL DEFAULT 0,
    hay MEDIUMTEXT NOT NULL,
    meta VARCHAR(1024) NOT NULL DEFAULT '',
    PRIMARY KEY (vod_id),
    KEY mac_vod_search_idx_status_time (vod_status, vod_time)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*) AS c FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'mac_vod_search_idx' AND index_name = 'ft_hay'`;
  if (!Number(rows[0]?.c || 0)) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE mac_vod_search_idx ADD FULLTEXT INDEX ft_hay (hay) WITH PARSER ngram",
    );
  }
}

function like(value: string) {
  return `%${value.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

export async function searchVodIds({
  wd,
  klass,
  area,
  year,
  skip,
  take,
}: {
  wd: string;
  klass?: string;
  area?: string;
  year?: string;
  skip: number;
  take: number;
}): Promise<{ ids: number[]; total: number }> {
  const conditions: Prisma.Sql[] = [Prisma.sql`vod_status = 1`];
  const q = wd.trim().toLowerCase();
  if (q.length >= 2) {
    conditions.push(Prisma.sql`MATCH(hay) AGAINST (${q} IN NATURAL LANGUAGE MODE)`);
    conditions.push(Prisma.sql`hay LIKE ${like(q)}`);
  } else if (q) {
    conditions.push(Prisma.sql`hay LIKE ${like(q)}`);
  }
  if (klass?.trim()) conditions.push(Prisma.sql`meta LIKE ${like(klass.trim().toLowerCase())}`);
  if (area?.trim()) conditions.push(Prisma.sql`meta LIKE ${like(area.trim().toLowerCase())}`);
  if (year?.trim()) conditions.push(Prisma.sql`meta LIKE ${like(year.trim().toLowerCase())}`);
  const where = Prisma.join(conditions, " AND ");

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRaw<{ c: bigint }[]>(Prisma.sql`SELECT COUNT(*) AS c FROM mac_vod_search_idx WHERE ${where}`),
    prisma.$queryRaw<{ vod_id: number }[]>(
      Prisma.sql`SELECT vod_id FROM mac_vod_search_idx WHERE ${where} ORDER BY vod_time DESC LIMIT ${take} OFFSET ${skip}`,
    ),
  ]);
  return { ids: idRows.map((r) => Number(r.vod_id)), total: Number(countRows[0]?.c || 0) };
}