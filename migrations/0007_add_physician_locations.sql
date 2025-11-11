-- Create location_status enum
CREATE TYPE "location_status" AS ENUM('active', 'inactive');
--> statement-breakpoint

-- Create physician_locations table
CREATE TABLE "physician_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"physician_id" varchar NOT NULL,
	"location_name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"status" "location_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "physician_locations" ADD CONSTRAINT "physician_locations_physician_id_users_id_fk" FOREIGN KEY ("physician_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Create index for faster queries
CREATE INDEX "physician_locations_physician_id_idx" ON "physician_locations"("physician_id");
--> statement-breakpoint

CREATE INDEX "physician_locations_status_idx" ON "physician_locations"("status");

