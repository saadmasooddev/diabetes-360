-- Migration: Add chat_messages table for DiaBot conversation history
-- Purpose: Store user and assistant messages per calendar date for AI chatbot
-- Date: 2026

CREATE TYPE "public"."chat_role_enum" AS ENUM('assistant', 'user');

CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chat_date" date NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "chat_role_enum" DEFAULT 'user' NOT NULL,
	"message" text NOT NULL
);

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "chat_messages_user_id_chat_date_idx" ON "chat_messages" ("user_id", "chat_date");
CREATE INDEX IF NOT EXISTS "chat_messages_recorded_at_idx" ON "chat_messages" ("recorded_at");
