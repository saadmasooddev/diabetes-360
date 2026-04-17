import { db } from "../../../app/config/db";
import { and, eq, sql } from "drizzle-orm";
import {
	type FcmDeviceType,
	usersFcmTokens,
	type UserFcmToken,
} from "../models/fcm.schema";

export class FcmTokenRepository {
	async upsertToken(
		userId: string,
		token: string,
		deviceType: FcmDeviceType,
	): Promise<void> {
		await db
			.insert(usersFcmTokens)
			.values({
				userId,
				token,
				deviceType,
			})
			.onConflictDoUpdate({
				target: [
					usersFcmTokens.userId,
					usersFcmTokens.token,
					usersFcmTokens.deviceType,
				],
				set: {
					updatedAt: new Date(),
				},
			});
	}

	async deleteToken(
		userId: string,
		token: string,
		deviceType: FcmDeviceType,
	): Promise<void> {
		await db
			.delete(usersFcmTokens)
			.where(
				and(
					eq(usersFcmTokens.userId, userId),
					eq(usersFcmTokens.token, token),
					eq(usersFcmTokens.deviceType, deviceType),
				),
			);
	}

	async listByUserId(userId: string): Promise<UserFcmToken[]> {
		return db
			.select()
			.from(usersFcmTokens)
			.where(eq(usersFcmTokens.userId, userId));
	}
}
