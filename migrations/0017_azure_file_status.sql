create type azure_file_status_enum as enum ('pending', 'confirmed');
alter table lab_reports add column status azure_file_status_enum not null default 'pending';