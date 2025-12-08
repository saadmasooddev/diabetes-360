-- Migration: Add food scan limits and daily scan tracking
-- This migration:
-- 1. Creates food_scan_limits table to store daily scan limits for free and paid users
-- 2. Creates food_scan_logs table to track daily scans per user (normalized to 3NF)
-- 3. Adds indexes for performance

-- Step 1: Create food_scan_limits table
CREATE TABLE "food_scan_limits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"free_user_limit" integer NOT NULL DEFAULT 5,
	"paid_user_limit" integer NOT NULL DEFAULT 20,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Step 2: Create food_scan_logs table (normalized to 3NF)
-- This table tracks daily scan counts per user
-- One record per user per day, with scan_count incremented on each scan
CREATE TABLE "food_scan_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"scan_date" date NOT NULL DEFAULT CURRENT_DATE,
	"scan_count" integer NOT NULL DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_scan_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "food_scan_logs_user_id_scan_date_unique" UNIQUE("user_id", "scan_date")
);
--> statement-breakpoint

-- Step 3: Create indexes for better query performance
CREATE INDEX "food_scan_logs_user_id_idx" ON "food_scan_logs"("user_id");
--> statement-breakpoint

CREATE INDEX "food_scan_logs_scan_date_idx" ON "food_scan_logs"("scan_date");
--> statement-breakpoint

CREATE INDEX "food_scan_logs_user_id_scan_date_idx" ON "food_scan_logs"("user_id", "scan_date");
--> statement-breakpoint

-- Step 4: Insert default food scan limits (one record)
INSERT INTO "food_scan_limits" ("free_user_limit", "paid_user_limit")
VALUES (5, 20)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
