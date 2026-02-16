import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const timeZones = pgTable("time_zones", {
	id: uuid("id").primaryKey().defaultRandom().notNull(),
	name: varchar("name").notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
