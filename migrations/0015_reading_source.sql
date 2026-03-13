create type health_metric_reading_source_enum as enum ('mobile', 'cgm', 'watch', 'custom');
alter table health_metrics add column reading_source health_metric_reading_source_enum not null default 'custom';
alter table exercise_logs add column reading_source health_metric_reading_source_enum not null default 'custom';