import { sql } from "drizzle-orm";
import {
	pgTable,
	text,
	varchar,
	timestamp,
	numeric,
	integer,
	boolean,
	pgEnum,
	primaryKey,
	PrimaryKey,
	uniqueIndex,
	index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, physicianLocations } from "../../auth/models/user.schema";

export enum BOOKING_STATUS_ENUM {
	PENDING = "pending",
	CONFIRMED = "confirmed",
	CANCELLED = "cancelled",
	COMPLETED = "completed",
}

export enum BOOKING_TYPE_QUERY_ENUM {
	UPCOMING = "upcoming",
	PAST = "past",
}

export const bookedSlotsStatusEnum = pgEnum(
	"booking_status_enum",
	Object.values(BOOKING_STATUS_ENUM) as [string, ...string[]],
);
export const BOOKED_SLOTS_STATUS = z.enum(Object.values(BOOKING_STATUS_ENUM));
// Booking System Tables
export const slotSize = pgTable("slot_size", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	size: integer("size").notNull().unique(), // 10, 15, 20, 30, 35, 60
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const availabilityDate = pgTable(
	"availability_date",
	{
		id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
		physicianId: varchar("physician_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		date: timestamp("date").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex("availability_date_physician_id_date_unique").on(
			t.physicianId,
			t.date,
		),
	],
);

export const slots = pgTable(
	"slots",
	{
		id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
		availabilityId: varchar("availability_id")
			.notNull()
			.references(() => availabilityDate.id, { onDelete: "cascade" }),
		startTime: text("start_time").notNull(), // Stored as time string (HH:MM:SS)
		endTime: text("end_time").notNull(), // Stored as time string (HH:MM:SS)
		slotSizeId: varchar("slot_size_id")
			.notNull()
			.references(() => slotSize.id, { onDelete: "restrict" }),
		isCustom: boolean("is_custom").notNull().default(false), // Indicates if this is a custom-sized slot
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("idx_slots_availability_id_start_time_end_time").on(
			table.availabilityId,
			table.startTime,
			table.endTime,
		),
	],
);

export const SLOT_TYPE = {
	ONLINE: "online",
	ONSITE: "onsite",
} as const;
export const slotTypeSchema = z.enum(
	Object.values(SLOT_TYPE) as [string, ...string[]],
);
export const slotTypeEnum = pgEnum(
	"slot_type_enum",
	Object.values(SLOT_TYPE) as [string, ...string[]],
);

export const slotType = pgTable("slot_type", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	type: slotTypeEnum("type").notNull().unique(), // 'online', 'onsite', etc.
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const slotTypeJunction = pgTable(
	"slot_type_junction",
	{
		slotId: varchar("slot_id")
			.notNull()
			.references(() => slots.id, { onDelete: "cascade" }),
		slotTypeId: varchar("slot_type_id")
			.notNull()
			.references(() => slotType.id, { onDelete: "restrict" }),
	},
	(t) => [primaryKey({ columns: [t.slotId, t.slotTypeId] })],
);

export const slotPrice = pgTable("slot_price", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	slotId: varchar("slot_id")
		.notNull()
		.references(() => slots.id, { onDelete: "cascade" }),
	slotTypeId: varchar("slot_type_id")
		.notNull()
		.references(() => slotType.id, { onDelete: "restrict" }),
	price: numeric("price", { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export enum BOOKING_TYPE_ENUM {
	FREE = "free",
	DISCOUNTED = "discounted",
	PAID = "paid",
}

export enum SUMMARY_STATUS_ENUM {
	SAVE_AS_DRAFT = "save_as_draft",
	SIGNED = "SIGNED",
}

export const summaryStatusEnum = z.enum(Object.values(SUMMARY_STATUS_ENUM));
export const summaryStutusEnumPg = pgEnum(
	"summary_status_enum",
	Object.values(SUMMARY_STATUS_ENUM) as [string, ...string[]],
);

export const bookedSlots = pgTable(
	"booked_slots",
	{
		id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
		customerId: varchar("customer_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		slotId: varchar("slot_id")
			.notNull()
			.references(() => slots.id, { onDelete: "restrict" }),
		slotTypeId: varchar("slot_type_id")
			.notNull()
			.references(() => slotType.id, { onDelete: "restrict" }), // The selected booking type (online/onsite)
		status: bookedSlotsStatusEnum("status").notNull().default("pending"), // 'pending', 'confirmed', 'cancelled', 'completed'
		summary: text("summary"), // Consultation summary added by physician
		summaryStatus: summaryStutusEnumPg("summary_status").default(
			SUMMARY_STATUS_ENUM.SAVE_AS_DRAFT,
		),
		meetingLink: text("meeting_link"), // Zoom (or other) link for online consultations; set by cron
		meetingTimeUtc: timestamp("meeting_time_utc", {
			withTimezone: true,
		}).notNull(),
		reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("idx_booked_slots_reminder_sent_at").on(table.reminderSentAt),
		index("idx_booked_slots_meeting_time_utc").on(table.meetingTimeUtc),
	],
);

// Junction table linking slots to physician locations for offline consultations
export const slotLocations = pgTable("slot_locations", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	slotId: varchar("slot_id")
		.notNull()
		.references(() => slots.id, { onDelete: "cascade" }),
	locationId: varchar("location_id")
		.notNull()
		.references(() => physicianLocations.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schemas for booking system
export const insertSlotSizeSchema = createInsertSchema(slotSize).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const insertAvailabilityDateSchema = createInsertSchema(
	availabilityDate,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const insertSlotSchema = createInsertSchema(slots).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const insertSlotTypeSchema = createInsertSchema(slotType).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const insertSlotTypeJunctionSchema =
	createInsertSchema(slotTypeJunction);

export const insertSlotPriceSchema = createInsertSchema(slotPrice).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const insertBookedSlotSchema = createInsertSchema(bookedSlots)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		slotTypeId: z.string().min(1, "Slot type ID is required"),
		status: z
			.enum(["pending", "confirmed", "cancelled", "completed"])
			.default("pending"),
	});

export const updateSlotPriceSchema = createInsertSchema(slotPrice)
	.omit({
		id: true,
		slotId: true,
		slotTypeId: true,
		createdAt: true,
		updatedAt: true,
	})
	.partial();

export const updateBookedSlotSchema = createInsertSchema(bookedSlots)
	.omit({
		id: true,
		customerId: true,
		slotId: true,
		createdAt: true,
		updatedAt: true,
	})
	.partial()
	.extend({
		summary: z.string().optional().nullable(),
		isAttended: z.boolean().optional(),
	});

export const insertSlotLocationSchema = createInsertSchema(slotLocations).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

// Types
export type SlotSize = typeof slotSize.$inferSelect;
export type InsertSlotSize = z.infer<typeof insertSlotSizeSchema>;
export type AvailabilityDate = typeof availabilityDate.$inferSelect;
export type InsertAvailabilityDate = z.infer<
	typeof insertAvailabilityDateSchema
>;
export type Slot = typeof slots.$inferSelect;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type SlotType = typeof slotType.$inferSelect;
export type InsertSlotType = z.infer<typeof insertSlotTypeSchema>;
export type SlotTypeJunction = typeof slotTypeJunction.$inferSelect;
export type InsertSlotTypeJunction = z.infer<
	typeof insertSlotTypeJunctionSchema
>;
export type SlotPrice = typeof slotPrice.$inferSelect;
export type InsertSlotPrice = z.infer<typeof insertSlotPriceSchema>;
export type UpdateSlotPrice = z.infer<typeof updateSlotPriceSchema>;
export type BookedSlot = typeof bookedSlots.$inferSelect;
export type InsertBookedSlot = z.infer<typeof insertBookedSlotSchema>;
export type UpdateBookedSlot = z.infer<typeof updateBookedSlotSchema>;
export type SlotLocation = typeof slotLocations.$inferSelect;
export type InsertSlotLocation = z.infer<typeof insertSlotLocationSchema>;
