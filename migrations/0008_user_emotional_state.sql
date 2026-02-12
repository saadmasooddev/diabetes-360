-- Migration: Add user_emotional_state table for AI emotional state (6h cooldown)
-- Purpose: Store mood, motivation_level, stress_signals, confidence from POST /api/chat/emotional-state/
-- Date: 2026

CREATE TABLE IF NOT EXISTS "user_emotional_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL UNIQUE,
	"mood" varchar NOT NULL,
	"motivation_level" varchar NOT NULL,
	"stress_signals" jsonb NOT NULL,
	"confidence" varchar NOT NULL,
	"stored_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "user_emotional_state" ADD CONSTRAINT "user_emotional_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "user_emotional_state_stored_at_idx" ON "user_emotional_state" ("stored_at");
