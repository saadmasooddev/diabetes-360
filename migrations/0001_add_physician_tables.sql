-- Create physician_specialties table
CREATE TABLE "physician_specialties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "physician_specialties_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Create physician_data table
CREATE TABLE "physician_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"specialty_id" varchar NOT NULL,
	"practice_start_date" timestamp NOT NULL,
	"consultation_fee" numeric(10, 2) NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "physician_data_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint

-- Create physician_ratings table
CREATE TABLE "physician_ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"physician_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "physician_data" ADD CONSTRAINT "physician_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "physician_data" ADD CONSTRAINT "physician_data_specialty_id_physician_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."physician_specialties"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "physician_ratings" ADD CONSTRAINT "physician_ratings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "physician_ratings" ADD CONSTRAINT "physician_ratings_physician_id_users_id_fk" FOREIGN KEY ("physician_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Insert default "General" specialty
INSERT INTO "physician_specialties" ("name", "description", "icon", "is_active", "created_at", "updated_at")
VALUES ('General', 'General physician specialty', 'stethoscope', true, now(), now());

