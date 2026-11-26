ALTER TABLE mac_vod
  ADD INDEX mac_vod_status_hits_day_idx (vod_status, vod_hits_day, vod_time),
  ADD INDEX mac_vod_status_hits_month_idx (vod_status, vod_hits_month, vod_time),
  ADD INDEX mac_vod_status_type1_score_idx (vod_status, type_id_1, vod_score),
  ADD INDEX mac_vod_status_type_score_idx (vod_status, type_id, vod_score),
  ALGORITHM=INPLACE, LOCK=NONE;
