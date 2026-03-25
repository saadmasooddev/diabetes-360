CREATE TYPE "public"."diabetes_type_enum" AS ENUM('type1', 'type2', 'gestational', 'prediabetes');--> statement-breakpoint
CREATE TYPE "public"."blood_sugar_reading_type_enum" AS ENUM('fasting', 'random', 'hba1c', 'normal');--> statement-breakpoint
CREATE TYPE "public"."health_metric_reading_source_enum" AS ENUM('mobile', 'cgm', 'watch', 'custom');--> statement-breakpoint
CREATE TYPE "public"."quick_log_diet_type_enum" AS ENUM('mostly_home_cooked', 'mixed', 'high_carb_outside');--> statement-breakpoint
CREATE TYPE "public"."quick_log_exercise_type_enum" AS ENUM('none', 'light', 'moderate', 'intense');--> statement-breakpoint
CREATE TYPE "public"."quick_log_medicines_type_enum" AS ENUM('taken', 'missed');--> statement-breakpoint
CREATE TYPE "public"."quick_log_sleep_duration_type_enum" AS ENUM('less_5', '5_7', 'more_7');--> statement-breakpoint
CREATE TYPE "public"."quick_log_stress_level_type_enum" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."slot_type_enum" AS ENUM('online', 'onsite');--> statement-breakpoint
CREATE TYPE "public"."summary_status_enum" AS ENUM('save_as_draft', 'SIGNED');--> statement-breakpoint
CREATE TYPE "public"."azure_file_status_enum" AS ENUM('pending', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."chat_role_enum" AS ENUM('assistant', 'user');--> statement-breakpoint
CREATE TABLE "daily_quick_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"log_date" date NOT NULL,
	"exercise" varchar,
	"diet" varchar,
	"sleep_duration" varchar,
	"medicines" varchar,
	"stress_level" varchar,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hba1c_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"hba1c" numeric NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logged_meals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"meal_date" date DEFAULT CURRENT_DATE NOT NULL,
	"food_name" text NOT NULL,
	"carbs" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sugars" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fibres" numeric(10, 2) DEFAULT '0' NOT NULL,
	"proteins" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fats" numeric(10, 2) DEFAULT '0' NOT NULL,
	"calories" numeric(10, 2) DEFAULT '0' NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"time_zone_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"memories_date" date NOT NULL,
	"memories" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chat_date" date NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "chat_role_enum" DEFAULT 'user' NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_health_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"summary_date" date NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_emotional_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"mood" varchar NOT NULL,
	"motivation_level" varchar NOT NULL,
	"stress_signals" jsonb NOT NULL,
	"confidence" varchar NOT NULL,
	"stored_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_emotional_state_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "time_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_zones_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "customer_data" ALTER COLUMN "diabetes_type" SET DATA TYPE "public"."diabetes_type_enum" USING "diabetes_type"::"public"."diabetes_type_enum";--> statement-breakpoint
ALTER TABLE "exercise_logs" ALTER COLUMN "exercise_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "free_tier_limits" ALTER COLUMN "glucose_limit" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "free_tier_limits" ALTER COLUMN "steps_limit" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "free_tier_limits" ALTER COLUMN "water_limit" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "slot_type" ALTER COLUMN "type" SET DATA TYPE "public"."slot_type_enum" USING "type"::"public"."slot_type_enum";--> statement-breakpoint
ALTER TABLE "customer_data" ADD COLUMN "main_goal" text;--> statement-breakpoint
ALTER TABLE "customer_data" ADD COLUMN "medication_info" text;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "exercise_name" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD COLUMN "reading_source" "health_metric_reading_source_enum" DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE "health_metrics" ADD COLUMN "blood_sugar_reading_type" "blood_sugar_reading_type_enum" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "health_metrics" ADD COLUMN "reading_source" "health_metric_reading_source_enum" DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE "booked_slots" ADD COLUMN "summary_status" "summary_status_enum" DEFAULT 'save_as_draft';--> statement-breakpoint
ALTER TABLE "booked_slots" ADD COLUMN "meeting_link" text;--> statement-breakpoint
ALTER TABLE "slots" ADD COLUMN "is_custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD COLUMN "report_name" text;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD COLUMN "report_type" varchar;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD COLUMN "date_of_report" date;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD COLUMN "status" "azure_file_status_enum" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_quick_logs" ADD CONSTRAINT "daily_quick_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hba1c_metrics" ADD CONSTRAINT "hba1c_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logged_meals" ADD CONSTRAINT "logged_meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logged_meals" ADD CONSTRAINT "logged_meals_time_zone_id_time_zones_id_fk" FOREIGN KEY ("time_zone_id") REFERENCES "public"."time_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_memories" ADD CONSTRAINT "chat_memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_health_summaries" ADD CONSTRAINT "daily_health_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_emotional_state" ADD CONSTRAINT "user_emotional_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_quick_logs_user_log_date" ON "daily_quick_logs" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chat_memories_user_date" ON "chat_memories" USING btree ("user_id","memories_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_health_summaries_user_date" ON "daily_health_summaries" USING btree ("user_id","summary_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_exercise_logs_recorded_at_reading_source" ON "exercise_logs" USING btree ("recorded_at","reading_source");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_health_metrics_recorded_at_reading_source" ON "health_metrics" USING btree ("recorded_at","reading_source");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_id_recommedation_date" ON "daily_nutrient_recommendations" USING btree ("user_id","recommendation_date");--> statement-breakpoint
CREATE UNIQUE INDEX "availability_date_physician_id_date_unique" ON "availability_date" USING btree ("physician_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_slots_availability_id_start_time_end_time" ON "slots" USING btree ("availability_id","start_time","end_time");--> statement-breakpoint
ALTER TABLE "customer_data" DROP COLUMN "diagnosis_date";