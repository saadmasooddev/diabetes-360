-- Create slot_locations table (junction table for slots and physician_locations)
-- This table links slots to specific locations for offline consultations
-- Normalized to 3NF: Each slot can have multiple locations, each location belongs to one physician
CREATE TABLE "slot_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" varchar NOT NULL,
	"location_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slot_locations_slot_id_location_id_unique" UNIQUE("slot_id", "location_id")
);
--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "slot_locations" ADD CONSTRAINT "slot_locations_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "slot_locations" ADD CONSTRAINT "slot_locations_location_id_physician_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."physician_locations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for faster queries
CREATE INDEX "slot_locations_slot_id_idx" ON "slot_locations"("slot_id");
--> statement-breakpoint

CREATE INDEX "slot_locations_location_id_idx" ON "slot_locations"("location_id");
--> statement-breakpoint

