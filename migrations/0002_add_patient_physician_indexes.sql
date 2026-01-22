-- Migration: Add indexes for patient-physician relationship queries
-- Purpose: Optimize queries that find patients by latest consulting physician
-- Date: 2024

-- Index on booked_slots.customer_id for faster patient lookups
CREATE INDEX IF NOT EXISTS "idx_booked_slots_customer_id" ON "booked_slots" ("customer_id");

-- Index on booked_slots.status for filtering by consultation status
CREATE INDEX IF NOT EXISTS "idx_booked_slots_status" ON "booked_slots" ("status");

-- Composite index for common query pattern: customer_id + status
CREATE INDEX IF NOT EXISTS "idx_booked_slots_customer_status" ON "booked_slots" ("customer_id", "status");

-- Index on availability_date.date for date-based queries and sorting
CREATE INDEX IF NOT EXISTS "idx_availability_date_date" ON "availability_date" ("date");

-- Composite index for physician and date lookups
CREATE INDEX IF NOT EXISTS "idx_availability_date_physician_date" ON "availability_date" ("physician_id", "date");

-- Index on slots.availability_id for join performance
CREATE INDEX IF NOT EXISTS "idx_slots_availability_id" ON "slots" ("availability_id");

