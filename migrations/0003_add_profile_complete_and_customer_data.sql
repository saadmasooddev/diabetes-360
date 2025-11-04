-- Add profile_complete column to users table
ALTER TABLE "users" ADD COLUMN "profile_complete" boolean DEFAULT false NOT NULL;

-- Create customer_data table
CREATE TABLE "customer_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" text NOT NULL,
	"birth_day" text NOT NULL,
	"birth_month" text NOT NULL,
	"birth_year" text NOT NULL,
	"diagnosis_day" text NOT NULL,
	"diagnosis_month" text NOT NULL,
	"diagnosis_year" text NOT NULL,
	"weight" text NOT NULL,
	"height" text NOT NULL,
	"diabetes_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_data_user_id_unique" UNIQUE("user_id")
);

-- Add foreign key constraint
ALTER TABLE "customer_data" ADD CONSTRAINT "customer_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Update existing users to have profile_complete = false (already default, but explicit for clarity)
UPDATE "users" SET "profile_complete" = false WHERE "profile_complete" IS NULL;

