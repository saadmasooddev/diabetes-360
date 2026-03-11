create type summary_status_enum as enum ('save_as_draft', 'SIGNED');
alter table booked_slots add column summary_status summary_status_enum not null default 'save_as_draft';
