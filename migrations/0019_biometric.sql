create table biometric_devices (
	id uuid primary key default gen_random_uuid(),
	user_id varchar not null references users(id) on delete cascade,
	device_id varchar(64) not null,
	device_name varchar(255) not null,
	device_type varchar(32) not null,
	public_key text not null,
	created_at timestamp not null default now(),
	updated_at timestamp not null default now()
);
create unique index unique_public_key_user_id on biometric_devices(public_key, user_id);