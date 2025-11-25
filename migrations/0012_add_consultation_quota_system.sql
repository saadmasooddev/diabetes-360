-- Add payment_type to users table for paid users
-- This will be NULL for free users, 'monthly' or 'annual' for paid users
ALTER TABLE "users" ADD COLUMN "payment_type" text;
--> statement-breakpoint

-- Create user_consultation_quotas table to track consultation quotas per user
-- Normalized to 3NF: Each quota record belongs to one user
CREATE TABLE "user_consultation_quotas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"discounted_consultations_used" integer DEFAULT 0 NOT NULL,
	"free_consultations_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_consultation_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "user_consultation_quotas_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint

-- Add consultation quota limits to free_tier_limits table
-- These limits apply to all new users going forward
ALTER TABLE "free_tier_limits" ADD COLUMN "discounted_consultation_quota" integer DEFAULT 0;
--> statement-breakpoint

ALTER TABLE "free_tier_limits" ADD COLUMN "free_consultation_quota" integer DEFAULT 0;
--> statement-breakpoint

-- Create indexes for faster queries
CREATE INDEX "user_consultation_quotas_user_id_idx" ON "user_consultation_quotas"("user_id");
--> statement-breakpoint

