-- Create health_metric_targets table for storing admin recommended values and user-specific targets
-- Normalized to 3NF: Separate table with userId (nullable for admin defaults), metricType, and targetValue
-- This allows:
-- 1. Admin to set system-wide recommended values (userId = NULL)
-- 2. Users to set their own personal targets (userId = specific user id)
-- 3. One record per metric type per user (or system-wide)

CREATE TYPE "public"."metric_type" AS ENUM('glucose', 'steps', 'water_intake', 'heart_rate');
--> statement-breakpoint

CREATE TABLE "health_metric_targets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"metric_type" "metric_type" NOT NULL,
	"target_value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_metric_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "health_metric_targets_user_id_metric_type_unique" UNIQUE("user_id", "metric_type")
);
--> statement-breakpoint

-- Create index for faster queries
CREATE INDEX "health_metric_targets_user_id_idx" ON "health_metric_targets"("user_id");
--> statement-breakpoint

CREATE INDEX "health_metric_targets_metric_type_idx" ON "health_metric_targets"("metric_type");
--> statement-breakpoint

