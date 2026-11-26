CREATE TABLE IF NOT EXISTS mac_vod_search_idx (
  vod_id INT NOT NULL,
  vod_status INT NOT NULL DEFAULT 0,
  vod_time INT NOT NULL DEFAULT 0,
  hay MEDIUMTEXT NOT NULL,
  meta VARCHAR(1024) NOT NULL DEFAULT '',
  PRIMARY KEY (vod_id),
  KEY mac_vod_search_idx_status_time (vod_status, vod_time),
  FULLTEXT KEY ft_hay (hay) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO mac_vod_search_idx (vod_id, vod_status, vod_time, hay, meta)
SELECT
  vod_id,
  vod_status,
  vod_time,
  LOWER(CONCAT_WS(CHAR(1), COALESCE(vod_name,''), COALESCE(vod_actor,''), COALESCE(vod_director,''), COALESCE(vod_blurb,''))),
  LOWER(CONCAT_WS(CHAR(1), COALESCE(vod_class,''), COALESCE(vod_area,''), COALESCE(vod_year,'')))
FROM mac_vod
ON DUPLICATE KEY UPDATE
  vod_status = VALUES(vod_status),
  vod_time = VALUES(vod_time),
  hay = VALUES(hay),
  meta = VALUES(meta);
