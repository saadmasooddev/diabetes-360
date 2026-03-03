alter table booked_slots add column meeting_link text;
alter table customer_data drop column diagnosis_date;

create table hba1c_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id varchar not null references users(id) on delete cascade,
  hba1c numeric not null,
  recordedAt timestamp with time zone default now() not null
);

alter table customer_data add column main_goal text;
alter table customer_data add column medication_info text;

create type blood_sugar_reading_type_enum as enum ('normal', 'fasting', 'random', 'hba1c');
alter table health_metrics add column blood_sugar_reading_type blood_sugar_reading_type_enum not null default 'normal';