ALTER TABLE mac_vod
  ADD INDEX mac_vod_status_hits_time_idx (vod_status, vod_hits, vod_time),
  ADD INDEX mac_vod_status_week_time_idx (vod_status, vod_hits_week, vod_time),
  ADD INDEX mac_vod_status_type1_hits_idx (vod_status, type_id_1, vod_hits),
  ADD INDEX mac_vod_status_type_hits_idx (vod_status, type_id, vod_hits),
  DROP INDEX mac_vod_status_hits_idx,
  DROP INDEX mac_vod_status_week_idx,
  ALGORITHM=INPLACE, LOCK=NONE;