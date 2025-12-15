-- Migration: Add meal plans and personalized insights tables
-- This migration:
-- 1. Creates daily_meal_plans table to store meal plan recommendations per user per day (normalized to 3NF)
-- 2. Creates meal_plan_meals table to store individual meals within meal plans (normalized to 3NF)
-- 3. Creates daily_personalized_insights table to store personalized insights per user per day
-- 4. Adds indexes for performance


create type meal_type_enum as enum('Breakfast', 'Lunch', 'Dinner');
-- Step 1: Create daily_meal_plans table
-- This table stores one record per user per day for meal plan recommendations
CREATE TABLE "daily_meal_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_date" date NOT NULL DEFAULT CURRENT_DATE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "daily_meal_plans_user_id_plan_date_unique" UNIQUE("user_id", "plan_date")
);

-- Step 2: Create meal_plan_meals table (normalized to 3NF)
-- This table stores individual meals within meal plans
-- Each meal belongs to a meal plan and has a meal type (Breakfast, Lunch, Dinner)
CREATE TABLE "meal_plan_meals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_plan_id" varchar NOT NULL,
	"meal_type"  meal_type_enum NOT NULL, -- Breakfast, Lunch, Dinner
	"name" text NOT NULL, -- e.g., "Oatmeal with berries"
	"carbs" numeric(10, 2) NOT NULL,
	"proteins" numeric(10, 2) NOT NULL,
	"calories" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meal_plan_meals_meal_plan_id_daily_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."daily_meal_plans"("id") ON DELETE cascade ON UPDATE no action
);

-- Step 3: Create daily_personalized_insights table
-- This table stores personalized insights per user per day
CREATE TABLE "daily_personalized_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"insight_date" date NOT NULL DEFAULT CURRENT_DATE,
	"insight_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_personalized_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);

-- Step 4: Create indexes for better query performance
CREATE INDEX "daily_meal_plans_user_id_idx" ON "daily_meal_plans"("user_id");
--> statement-breakpoint

CREATE INDEX "daily_meal_plans_plan_date_idx" ON "daily_meal_plans"("plan_date");
--> statement-breakpoint

CREATE INDEX "daily_meal_plans_user_id_plan_date_idx" ON "daily_meal_plans"("user_id", "plan_date");
--> statement-breakpoint

CREATE INDEX "meal_plan_meals_meal_plan_id_idx" ON "meal_plan_meals"("meal_plan_id");
--> statement-breakpoint

CREATE INDEX "meal_plan_meals_meal_name_idx" ON "meal_plan_meals"("meal_name");
--> statement-breakpoint

CREATE INDEX "daily_personalized_insights_user_id_idx" ON "daily_personalized_insights"("user_id");
--> statement-breakpoint

CREATE INDEX "daily_personalized_insights_insight_date_idx" ON "daily_personalized_insights"("insight_date");
--> statement-breakpoint

CREATE INDEX "daily_personalized_insights_user_id_insight_date_idx" ON "daily_personalized_insights"("user_id", "insight_date");
--> statement-breakpoint

