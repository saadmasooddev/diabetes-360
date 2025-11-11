-- Migration: Move firstName/lastName from customer_data to users, remove username
-- This migration:
-- 1. Adds firstName and lastName columns to users table
-- 2. Migrates existing data from customer_data to users
-- 3. Removes firstName and lastName from customer_data
-- 4. Removes username column from users table

-- Step 1: Add firstName and lastName columns to users (nullable initially for data migration)
ALTER TABLE "users" 
  ADD COLUMN "first_name" text,
  ADD COLUMN "last_name" text;

-- Step 2: Migrate firstName and lastName from customer_data to users
-- For users who have customer_data, copy their names
UPDATE "users"
SET 
  "first_name" = cd."first_name",
  "last_name" = cd."last_name"
FROM "customer_data" cd
WHERE "users"."id" = cd."user_id"
  AND cd."first_name" IS NOT NULL
  AND cd."last_name" IS NOT NULL;

-- Step 3: For users without customer_data, try to extract from username or use defaults
-- Extract first and last name from username (if it contains a space)
UPDATE "users"
SET 
  "first_name" = CASE
    WHEN "first_name" IS NULL AND "username" LIKE '% %' THEN
      SPLIT_PART("username", ' ', 1)
    WHEN "first_name" IS NULL THEN
      "username"
    ELSE "first_name"
  END,
  "last_name" = CASE
    WHEN "last_name" IS NULL AND "username" LIKE '% %' THEN
      SUBSTRING("username" FROM POSITION(' ' IN "username") + 1)
    WHEN "last_name" IS NULL THEN
      ''
    ELSE "last_name"
  END
WHERE "first_name" IS NULL OR "last_name" IS NULL;

-- Step 4: Set default values for any remaining NULL names
UPDATE "users"
SET "first_name" = COALESCE("first_name", 'User')
WHERE "first_name" IS NULL;

UPDATE "users"
SET "last_name" = COALESCE("last_name", '')
WHERE "last_name" IS NULL;

-- Step 5: Make the new columns NOT NULL now that all data is migrated
ALTER TABLE "users"
  ALTER COLUMN "first_name" SET NOT NULL,
  ALTER COLUMN "last_name" SET NOT NULL;

-- Step 6: Remove firstName and lastName from customer_data
ALTER TABLE "customer_data"
  DROP COLUMN IF EXISTS "first_name",
  DROP COLUMN IF EXISTS "last_name";

-- Step 7: Remove username column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "username";

-- Step 8: Drop the unique constraint on username if it exists (handled by dropping the column)
-- Note: The unique constraint will be automatically removed when the column is dropped

