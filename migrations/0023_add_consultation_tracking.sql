-- Migration: Add consultation tracking fields to booked_slots
-- This migration:
-- 1. Adds summary column to booked_slots for physician to add consultation summary
-- 2. Adds is_attended boolean column to track if user visited consultation page
-- 3. Normalized to 3NF: summary and is_attended are attributes of booked_slots entity

-- Step 1: Add summary column to booked_slots table
ALTER TABLE "booked_slots" ADD COLUMN "summary" text;
--> statement-breakpoint

-- Step 4: Create index for better query performance on customer_id and status
CREATE INDEX "booked_slots_customer_id_status_idx" ON "booked_slots"("customer_id", "status");
--> statement-breakpoint

create type booking_status_enum as enum('pending', 'confirmed', 'cancelled', 'completed');
alter table "booked_slots" add column booking_status_enum booking_status_enum not null default 'pending';
update "booked_slots" set booking_status_enum = "status";
alter table "booked_slots" drop column "status";
alter table "booked_slots" rename column "booking_status_enum" to "status";