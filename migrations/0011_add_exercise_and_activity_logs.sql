-- Create activity_logs table for time-based activities (walking, yoga)
-- Normalized to 3NF: Each activity log belongs to one user, activity type is normalized
CREATE TYPE "activity_type_enum" AS ENUM('walking', 'yoga');

CREATE TABLE "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" "activity_type_enum" NOT NULL,
	"duration_minutes" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

-- Create exercise_logs table for count-based strength training exercises
-- Normalized to 3NF: Each exercise log belongs to one user, exercise type is normalized
CREATE TYPE "exercise_type_enum" AS ENUM('pushups', 'squats', 'chinups', 'situps');

CREATE TABLE "exercise_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"exercise_type" "exercise_type_enum" NOT NULL,
	"count" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

-- Create indexes for faster queries
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");
--> statement-breakpoint

CREATE INDEX "activity_logs_activity_type_idx" ON "activity_logs"("activity_type");
--> statement-breakpoint

CREATE INDEX "activity_logs_recorded_at_idx" ON "activity_logs"("recorded_at");
--> statement-breakpoint

CREATE INDEX "exercise_logs_user_id_idx" ON "exercise_logs"("user_id");
--> statement-breakpoint

CREATE INDEX "exercise_logs_exercise_type_idx" ON "exercise_logs"("exercise_type");
--> statement-breakpoint

CREATE INDEX "exercise_logs_recorded_at_idx" ON "exercise_logs"("recorded_at");
--> statement-breakpoint

