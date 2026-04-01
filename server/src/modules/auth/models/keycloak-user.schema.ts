import {
	pgTable,
	text,
	varchar,
	timestamp,
	primaryKey,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

/**
 * Maps Keycloak subject (`sub`) claims to application users.
 * Kept in a separate table so SSO can be removed without altering core user columns.
 */
export const userKeycloakIds = pgTable(
	"user_keycloak_ids",
	{
		userId: varchar("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		keycloakSub: text("keycloak_sub").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.keycloakSub] }),
		uniqueIndex("user_keycloak_ids_keycloak_sub_unique").on(t.keycloakSub),
	],
);

export type UserKeycloakId = typeof userKeycloakIds.$inferSelect;
export type InsertUserKeycloakId = typeof userKeycloakIds.$inferInsert;
