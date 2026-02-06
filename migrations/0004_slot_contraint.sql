alter table slots add constraint "idx_slots_availability_id_start_time_end_time" 
unique(availability_id, start_time, end_time);