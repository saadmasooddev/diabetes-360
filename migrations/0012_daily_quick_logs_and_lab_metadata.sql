-- Daily Quick Logs table
create table daily_quick_logs (
  id varchar primary key default gen_random_uuid(),
  user_id varchar not null references users(id) on delete cascade,
  exercise varchar ,
  diet varchar ,
  sleep_duration varchar ,
  medicines varchar ,
  stress_level varchar ,
  recorded_at timestamp with time zone not null default now()
);

create index idx_daily_quick_logs_user_recorded on daily_quick_logs(user_id, recorded_at);

-- Lab reports metadata
alter table lab_reports add column if not exists report_name text;
alter table lab_reports add column if not exists report_type varchar;
alter table lab_reports add column if not exists date_of_report date;
