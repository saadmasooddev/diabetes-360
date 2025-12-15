-- Migration: Add nutrient tracking tables
-- This migration:
-- 1. Creates daily_nutrient_recommendations table to store AI-generated daily nutrient recommendations per user
-- 2. Creates food_scan_nutrients table to track consumed nutrients from each food scan (normalized to 3NF)
-- 3. Adds indexes for performance

-- Step 1: Create daily_nutrient_recommendations table
CREATE TABLE "daily_nutrient_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"recommendation_date" date NOT NULL DEFAULT CURRENT_DATE,
	"carbs" numeric(10, 2) NOT NULL,
	"sugars" numeric(10, 2) NOT NULL,
	"fibres" numeric(10, 2) NOT NULL,
	"proteins" numeric(10, 2) NOT NULL,
	"fats" numeric(10, 2) NOT NULL,
	"calories" numeric(10, 2) NOT NULL,
	"food_suggestions" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_nutrient_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "daily_nutrient_recommendations_user_id_recommendation_date_unique" UNIQUE("user_id", "recommendation_date")
);
--> statement-breakpoint

-- Step 2: Create food_scan_nutrients table (normalized to 3NF)
-- This table tracks consumed nutrients from each food scan per user per day
-- Aggregates nutrients consumed throughout the day
CREATE TABLE "food_scan_nutrients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"scan_date" date NOT NULL DEFAULT CURRENT_DATE,
	"carbs" numeric(10, 2) NOT NULL DEFAULT 0,
	"sugars" numeric(10, 2) NOT NULL DEFAULT 0,
	"fibres" numeric(10, 2) NOT NULL DEFAULT 0,
	"proteins" numeric(10, 2) NOT NULL DEFAULT 0,
	"fats" numeric(10, 2) NOT NULL DEFAULT 0,
	"calories" numeric(10, 2) NOT NULL DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_scan_nutrients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "food_scan_nutrients_user_id_scan_date_unique" UNIQUE("user_id", "scan_date")
);
--> statement-breakpoint

-- Step 3: Create indexes for better query performance
CREATE INDEX "daily_nutrient_recommendations_user_id_idx" ON "daily_nutrient_recommendations"("user_id");
--> statement-breakpoint

CREATE INDEX "daily_nutrient_recommendations_recommendation_date_idx" ON "daily_nutrient_recommendations"("recommendation_date");
--> statement-breakpoint

CREATE INDEX "daily_nutrient_recommendations_user_id_recommendation_date_idx" ON "daily_nutrient_recommendations"("user_id", "recommendation_date");
--> statement-breakpoint

CREATE INDEX "food_scan_nutrients_user_id_idx" ON "food_scan_nutrients"("user_id");
--> statement-breakpoint

CREATE INDEX "food_scan_nutrients_scan_date_idx" ON "food_scan_nutrients"("scan_date");
--> statement-breakpoint

CREATE INDEX "food_scan_nutrients_user_id_scan_date_idx" ON "food_scan_nutrients"("user_id", "scan_date");
--> statement-breakpoint

