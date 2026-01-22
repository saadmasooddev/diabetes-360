-- Migration: Add custom slot support fields
-- Purpose: Add isCustom flag and durationMinutes to slots table for better custom slot management
-- Date: 2024

-- Add isCustom boolean field with default false
ALTER TABLE "slots" ADD COLUMN IF NOT EXISTS "is_custom" BOOLEAN NOT NULL DEFAULT false;

-- Create index on isCustom for faster queries filtering custom slots
CREATE INDEX IF NOT EXISTS "idx_slots_is_custom" ON "slots" ("is_custom");
