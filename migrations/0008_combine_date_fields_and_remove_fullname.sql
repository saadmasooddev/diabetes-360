-- Migration: Combine date fields and remove fullName from users
-- This migration:
-- 1. Adds new birthday and diagnosis_date columns to customer_data
-- 2. Migrates existing data from separate day/month/year fields to combined date fields
-- 3. Drops old date columns
-- 4. Removes full_name column from users table

-- Step 1: Add new date columns to customer_data (nullable initially for data migration)
ALTER TABLE "customer_data" 
  ADD COLUMN "birthday" timestamp,
  ADD COLUMN "diagnosis_date" timestamp;

-- Step 2: Migrate existing data from separate fields to combined date fields
-- Convert birth_day, birth_month, birth_year to birthday
UPDATE "customer_data"
SET "birthday" = CASE
  WHEN "birth_day" IS NOT NULL AND "birth_month" IS NOT NULL AND "birth_year" IS NOT NULL
  THEN TO_TIMESTAMP(
    "birth_year" || '-' || 
    LPAD("birth_month", 2, '0') || '-' || 
    LPAD("birth_day", 2, '0') || ' 00:00:00',
    'YYYY-MM-DD HH24:MI:SS'
  )
  ELSE NULL
END;

-- Convert diagnosis_day, diagnosis_month, diagnosis_year to diagnosis_date
UPDATE "customer_data"
SET "diagnosis_date" = CASE
  WHEN "diagnosis_day" IS NOT NULL AND "diagnosis_month" IS NOT NULL AND "diagnosis_year" IS NOT NULL
  THEN TO_TIMESTAMP(
    "diagnosis_year" || '-' || 
    LPAD("diagnosis_month", 2, '0') || '-' || 
    LPAD("diagnosis_day", 2, '0') || ' 00:00:00',
    'YYYY-MM-DD HH24:MI:SS'
  )
  ELSE NULL
END;

-- Step 3: Set default values for any NULL dates (use current date as fallback)
UPDATE "customer_data"
SET "birthday" = CURRENT_DATE
WHERE "birthday" IS NULL;

UPDATE "customer_data"
SET "diagnosis_date" = CURRENT_DATE
WHERE "diagnosis_date" IS NULL;

-- Step 4: Make the new columns NOT NULL now that all data is migrated
ALTER TABLE "customer_data"
  ALTER COLUMN "birthday" SET NOT NULL,
  ALTER COLUMN "diagnosis_date" SET NOT NULL;

-- Step 5: Drop the old separate date columns
ALTER TABLE "customer_data"
  DROP COLUMN "birth_day",
  DROP COLUMN "birth_month",
  DROP COLUMN "birth_year",
  DROP COLUMN "diagnosis_day",
  DROP COLUMN "diagnosis_month",
  DROP COLUMN "diagnosis_year";

-- Step 6: Remove full_name column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name";

