create unique index if not exists idx_health_metrics_recorded_at_reading_source on health_metrics (recorded_at, reading_source);
create unique index if not exists idx_exercise_logs_recorded_at_reading_source on exercise_logs(recorded_at, reading_source);
