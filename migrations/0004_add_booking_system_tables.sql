-- Create slot_size table
CREATE TABLE "slot_size" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slot_size_size_unique" UNIQUE("size")
);
--> statement-breakpoint

-- Create availability_date table
CREATE TABLE "availability_date" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"physician_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create slots table
CREATE TABLE "slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"availability_id" varchar NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_size_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create slot_type table
CREATE TABLE "slot_type" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slot_type_type_unique" UNIQUE("type")
);
--> statement-breakpoint

-- Create slot_type_junction table
CREATE TABLE "slot_type_junction" (
	"slot_id" varchar NOT NULL,
	"slot_type_id" varchar NOT NULL,
	CONSTRAINT "slot_type_junction_slot_id_slot_type_id_pk" PRIMARY KEY("slot_id","slot_type_id")
);
--> statement-breakpoint

-- Create slot_price table
CREATE TABLE "slot_price" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" varchar NOT NULL,
	"slot_type_id" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create booked_slots table
CREATE TABLE "booked_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"slot_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "availability_date" ADD CONSTRAINT "availability_date_physician_id_users_id_fk" FOREIGN KEY ("physician_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_availability_id_availability_date_id_fk" FOREIGN KEY ("availability_id") REFERENCES "public"."availability_date"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_slot_size_id_slot_size_id_fk" FOREIGN KEY ("slot_size_id") REFERENCES "public"."slot_size"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slot_type_junction" ADD CONSTRAINT "slot_type_junction_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slot_type_junction" ADD CONSTRAINT "slot_type_junction_slot_type_id_slot_type_id_fk" FOREIGN KEY ("slot_type_id") REFERENCES "public"."slot_type"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slot_price" ADD CONSTRAINT "slot_price_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "slot_price" ADD CONSTRAINT "slot_price_slot_type_id_slot_type_id_fk" FOREIGN KEY ("slot_type_id") REFERENCES "public"."slot_type"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "booked_slots" ADD CONSTRAINT "booked_slots_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "booked_slots" ADD CONSTRAINT "booked_slots_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- Insert default slot sizes
INSERT INTO "slot_size" ("size") VALUES (10), (15), (20), (30), (45), (60);
--> statement-breakpoint

-- Insert default slot types
INSERT INTO "slot_type" ("type") VALUES ('online'), ('onsite');
--> statement-breakpoint

