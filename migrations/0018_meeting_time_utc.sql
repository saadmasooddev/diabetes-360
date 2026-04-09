alter type push_message_type_enum add value 'appointment_booked';
alter type push_message_type_enum add value 'appointment_reminder';
alter table booked_slots add column meeting_time_utc timestamp with time zone not null;
alter table logged_meals drop column time_zone_id;
alter table users add column time_zone_id uuid not null references time_zones(id);
alter table booked_slots add column reminder_sent_at timestamp with time zone;

create index if not exists idx_booked_slots_reminder_sent_at on booked_slots(reminder_sent_at);
create index if not exists idx_booked_slots_meeting_time_utc on booked_slots(meeting_time_utc);
