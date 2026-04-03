import { db } from "../../../app/config/db";
import { and, desc, eq, gte } from "drizzle-orm";
import {
	type PushMessageType,
	userPushNotifications,
} from "../models/fcm.schema";

export class PushNotificationLogRepository {
	async insert(params: {
		userId: string;
		title: string;
		body: string;
		messageType: PushMessageType;
		payload: Record<string, unknown> | null;
	}): Promise<void> {
		await db.insert(userPushNotifications).values({
			userId: params.userId,
			title: params.title,
			body: params.body,
			messageType: params.messageType,
			payload: params.payload,
		});
	}

	async hasRecentByType(
		userId: string,
		messageType: PushMessageType,
		since: Date,
	): Promise<boolean> {
		const [row] = await db
			.select({ id: userPushNotifications.id })
			.from(userPushNotifications)
			.where(
				and(
					eq(userPushNotifications.userId, userId),
					eq(userPushNotifications.messageType, messageType),
					gte(userPushNotifications.createdAt, since),
				),
			)
			.orderBy(desc(userPushNotifications.createdAt))
			.limit(1);
		return Boolean(row);
	}
}
