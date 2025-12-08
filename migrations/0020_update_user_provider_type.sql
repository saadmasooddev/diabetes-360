create type provider_enum as enum('manual', 'google', 'apple', 'facebook');
alter table users add column provider_enum provider_enum not null default 'manual';
update users set provider_enum = provider;
alter table users drop column provider;
alter table users rename column provider_enum to provider;