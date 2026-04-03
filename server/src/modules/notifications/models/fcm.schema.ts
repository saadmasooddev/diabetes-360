import { sql } from "drizzle-orm";
import {
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";

/** Client / device platform for FCM delivery options */
export enum FCM_DEVICE_TYPE_ENUM {
	IOS = "ios",
	ANDROID = "android",
	WEB=  "web",
};

export type FcmDeviceType =
	(typeof FCM_DEVICE_TYPE_ENUM)[keyof typeof FCM_DEVICE_TYPE_ENUM];

export const fcmDeviceTypePgEnum = pgEnum("fcm_device_type_enum", Object.values(FCM_DEVICE_TYPE_ENUM) as [string, ...string[]]);

export const fcmDeviceTypeZodSchema = z.enum(Object.values(FCM_DEVICE_TYPE_ENUM));

export enum PUSH_MESSAGE_TYPE_ENUM  {
	GLUCOSE_ALERT=  "glucose_alert",
	INACTIVITY_ALERT= "inactivity_alert",
};

export type PushMessageType =
	(typeof PUSH_MESSAGE_TYPE_ENUM)[keyof typeof PUSH_MESSAGE_TYPE_ENUM];

export const pushMessageTypePgEnum = pgEnum("push_message_type_enum", Object.values(PUSH_MESSAGE_TYPE_ENUM) as [ string, ...string[]]);

export const pushMessageTypeZodSchema = z.enum(Object.values(PUSH_MESSAGE_TYPE_ENUM));

export const usersFcmTokens = pgTable(
	"users_fcm_tokens",
	{
		userId: varchar("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull(),
		deviceType: fcmDeviceTypePgEnum("device_type").notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.token, t.deviceType] }),
	],
);

export const userPushNotifications = pgTable("user_push_notifications", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	body: text("body").notNull(),
	messageType: pushMessageTypePgEnum("message_type").notNull(),
	payload: jsonb("payload").$type<Record<string, unknown> | null>(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const fcmRegistrationSchema = z.object({
	token: z.string().min(1, "FCM token is required").max(4096),
	deviceType: fcmDeviceTypeZodSchema,
});

export type FcmRegistrationInput = z.infer<typeof fcmRegistrationSchema>;

export const optionalFcmRegistrationSchema = fcmRegistrationSchema.optional();

/** Data-only FCM payload (all values sent as strings on the wire) */
export type GlucoseAlertPushPayload = {
	glucoseMgDl: number;
	direction: "high" | "low";
	lowThresholdMgDl: number;
	highThresholdMgDl: number;
};

export type InactivityAlertPushPayload = {
	lastActivityAtIso: string | null;
};

export type PushMessagePayload =
	| {
			type: typeof PUSH_MESSAGE_TYPE_ENUM.GLUCOSE_ALERT;
			title: string;
			body: string;
			data: GlucoseAlertPushPayload;
	  }
	| {
			type: typeof PUSH_MESSAGE_TYPE_ENUM.INACTIVITY_ALERT;
			title: string;
			body: string;
			data: InactivityAlertPushPayload;
	  };

export type UserFcmToken = typeof usersFcmTokens.$inferSelect;
export type UserPushNotification = typeof userPushNotifications.$inferSelect;
