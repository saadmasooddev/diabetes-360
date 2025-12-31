alter table exercise_logs add column exercise_name varchar(200) not null;
alter table exercise_logs drop column exercise_type ;
alter table exercise_logs add column exercise_type varchar(200);