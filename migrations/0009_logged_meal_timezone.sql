CREATE TABLE IF NOT EXISTS "time_zones" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name varchar NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE logged_meals ADD COLUMN time_zone_id uuid REFERENCES time_zones(id) ON DELETE CASCADE ON UPDATE NO ACTION;
alter table logged_meals add column recorded_at timestamp with time zone DEFAULT now() NOT NULL;