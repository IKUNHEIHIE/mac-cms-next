ALTER TABLE mac_vod
  ADD INDEX mac_vod_status_time_idx (vod_status, vod_time),
  ADD INDEX mac_vod_status_hits_idx (vod_status, vod_hits),
  ADD INDEX mac_vod_status_week_idx (vod_status, vod_hits_week),
  ADD INDEX mac_vod_status_level_time_idx (vod_status, vod_level, vod_time),
  ADD INDEX mac_vod_status_type1_time_idx (vod_status, type_id_1, vod_time),
  ADD INDEX mac_vod_status_type_time_idx (vod_status, type_id, vod_time),
  ALGORITHM=INPLACE, LOCK=NONE;
