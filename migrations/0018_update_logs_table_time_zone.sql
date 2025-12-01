alter table health_metrics add column recorded_at_tz timestamp with time zone not null default now();
update health_metrics set recorded_at_tz = recorded_at;
alter table health_metrics drop column recorded_at;
alter table health_metrics rename recorded_at_tz to recorded_at;

alter table exercise_logs add column recorded_at_tz timestamp with time zone not null default now();
update exercise_logs set recorded_at_tz = recorded_at;
alter table exercise_logs drop column recorded_at;
alter table exercise_logs rename recorded_at_tz to recorded_at;

alter table activity_logs add column recorded_at_tz timestamp with time zone not null default now();
update activity_logs set recorded_at_tz = recorded_at;
alter table activity_logs drop column recorded_at;
alter table activity_logs rename recorded_at_tz to recorded_at;