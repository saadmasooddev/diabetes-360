-- Create passio_tokens table for storing Passio API authentication tokens
-- Normalized to 3NF: Single table storing token information with expiry tracking
-- This allows:
-- 1. Storing access tokens with their metadata
-- 2. Tracking token expiration for automatic refresh
-- 3. Maintaining a single active token record

CREATE TABLE "passio_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_token" text NOT NULL,
	"customer_id" text NOT NULL,
	"scope" text,
	"token_type" text DEFAULT 'Bearer' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create index for faster queries on expiry
CREATE INDEX "passio_tokens_expires_at_idx" ON "passio_tokens"("expires_at");
--> statement-breakpoint

