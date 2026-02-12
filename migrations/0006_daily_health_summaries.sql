-- Migration: Add daily_health_summaries table for last-days health summary (DiaBot context)
-- Purpose: Store one AI-generated health summary per user per calendar date; used in chat payload as last_days_health_summary
-- Date: 2026

CREATE TABLE IF NOT EXISTS "daily_health_summaries" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"summary_date" date NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "daily_health_summaries" ADD CONSTRAINT "daily_health_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_daily_health_summaries_user_date" ON "daily_health_summaries" ("user_id", "summary_date");

CREATE INDEX IF NOT EXISTS "daily_health_summaries_summary_date_idx" ON "daily_health_summaries" ("summary_date");
