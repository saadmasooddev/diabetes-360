-- Create two_factor_auth table for TOTP-based two-factor authentication
-- Normalized to 3NF: Separate table with userId foreign key, one record per user
-- Stores encrypted TOTP secret, backup codes, and enabled/verified status

CREATE TABLE "two_factor_auth" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "two_factor_auth_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "two_factor_auth_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

-- Create index for faster queries
CREATE INDEX "two_factor_auth_user_id_idx" ON "two_factor_auth"("user_id");
--> statement-breakpoint

