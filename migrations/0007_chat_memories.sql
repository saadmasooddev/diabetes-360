-- Migration: Add chat_memories table for AI-extracted chat memories per user per day
-- Purpose: Store suggested_memories from POST /api/chat/old-chat-memory/ for use in old_chat_memory in chat payload
-- Date: 2026

CREATE TABLE IF NOT EXISTS "chat_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"memories_date" date NOT NULL,
	"memories" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "chat_memories" ADD CONSTRAINT "chat_memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_chat_memories_user_date" ON "chat_memories" ("user_id", "memories_date");

CREATE INDEX IF NOT EXISTS "chat_memories_memories_date_idx" ON "chat_memories" ("memories_date");
