-- Migration: Add logged_meals table
-- Purpose: Track meals that users explicitly log after scanning (only logged meals count towards daily calories)
-- Date: 2024

CREATE TABLE IF NOT EXISTS "logged_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" VARCHAR(255) NOT NULL,
	"meal_date" date DEFAULT CURRENT_DATE NOT NULL,
	"food_name" text NOT NULL,
	"carbs" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sugars" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fibres" numeric(10, 2) DEFAULT '0' NOT NULL,
	"proteins" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fats" numeric(10, 2) DEFAULT '0' NOT NULL,
	"calories" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "logged_meals" ADD CONSTRAINT "logged_meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE INDEX IF NOT EXISTS "logged_meals_user_id_meal_date_idx" ON "logged_meals" ("user_id","meal_date");
