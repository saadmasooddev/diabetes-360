-- Migration: Add slot_type_id to booked_slots table
-- This migration adds the slot_type_id column to track which booking type (online/onsite) was selected

-- Step 1: Add slot_type_id column (nullable initially to handle existing records)
ALTER TABLE "booked_slots" ADD COLUMN "slot_type_id" varchar;
--> statement-breakpoint

-- Step 2: For existing bookings, we need to set a default slot type
-- We'll try to get the first available slot type for each booked slot
-- If a slot has multiple types, we'll use the first one from slot_type_junction
UPDATE "booked_slots" bs
SET "slot_type_id" = (
  SELECT stj."slot_type_id"
  FROM "slot_type_junction" stj
  WHERE stj."slot_id" = bs."slot_id"
  LIMIT 1
)
WHERE bs."slot_type_id" IS NULL;
--> statement-breakpoint

-- Step 3: Make the column NOT NULL now that we've populated existing records
-- Note: This will fail if there are any NULL values remaining
ALTER TABLE "booked_slots" ALTER COLUMN "slot_type_id" SET NOT NULL;
--> statement-breakpoint

-- Step 4: Add foreign key constraint to slot_type table
ALTER TABLE "booked_slots" ADD CONSTRAINT "booked_slots_slot_type_id_slot_type_id_fk" 
  FOREIGN KEY ("slot_type_id") REFERENCES "public"."slot_type"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- Step 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS "booked_slots_slot_type_id_idx" ON "booked_slots"("slot_type_id");
--> statement-breakpoint

