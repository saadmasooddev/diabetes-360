import { db } from "../../../app/config/db";
import { twoFactorAuth } from "../models/twoFactor.schema";
import type {
	TwoFactorAuth,
	InsertTwoFactorAuth,
	UpdateTwoFactorAuth,
} from "../models/twoFactor.schema";
import { eq } from "drizzle-orm";

export class TwoFactorRepository {
	async getByUserId(userId: string): Promise<TwoFactorAuth | null> {
		const [result] = await db
			.select()
			.from(twoFactorAuth)
			.where(eq(twoFactorAuth.userId, userId))
			.limit(1);

		return result || null;
	}

	async create(data: InsertTwoFactorAuth): Promise<TwoFactorAuth> {
		const [result] = await db
			.insert(twoFactorAuth)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		return result;
	}

	async update(
		userId: string,
		data: UpdateTwoFactorAuth,
	): Promise<TwoFactorAuth> {
		const [result] = await db
			.update(twoFactorAuth)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(twoFactorAuth.userId, userId))
			.returning();

		if (!result) {
			throw new Error("Two-factor authentication record not found");
		}

		return result;
	}

	async delete(userId: string): Promise<void> {
		await db.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userId));
	}
}
