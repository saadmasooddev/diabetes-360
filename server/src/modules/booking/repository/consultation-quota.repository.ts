import { db } from "../../../app/config/db";
import { userConsultationQuotas } from "../models/consultation-quota.schema";
import { eq } from "drizzle-orm";
import type {
	InsertUserConsultationQuota,
	UpdateUserConsultationQuota,
	UserConsultationQuota,
} from "../models/consultation-quota.schema";
import type { Tx } from "../../food/models/food.schema";

export class ConsultationQuotaRepository {
	async getUserConsultationQuota(
		userId: string,
		tx?: Tx,
	): Promise<UserConsultationQuota | null> {
		const dbConn = tx || db;
		const [quota] = await dbConn
			.select()
			.from(userConsultationQuotas)
			.where(eq(userConsultationQuotas.userId, userId))
			.limit(1);

		return quota || null;
	}

	async createUserConsultationQuota(
		data: InsertUserConsultationQuota,
		tx?: Tx,
	): Promise<UserConsultationQuota> {
		const dbConn = tx || db;
		const [quota] = await dbConn
			.insert(userConsultationQuotas)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		return quota;
	}

	async updateUserConsultationQuota(
		userId: string,
		data: UpdateUserConsultationQuota,
	): Promise<UserConsultationQuota> {
		const [quota] = await db
			.update(userConsultationQuotas)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(userConsultationQuotas.userId, userId))
			.returning();

		if (!quota) {
			throw new Error("User consultation quota not found");
		}

		return quota;
	}

	async incrementDiscountedConsultations(
		userId: string,
	): Promise<UserConsultationQuota> {
		const existing = await this.getUserConsultationQuota(userId);

		if (!existing) {
			return await this.createUserConsultationQuota({
				userId,
				discountedConsultationsUsed: 1,
				freeConsultationsUsed: 0,
			});
		}

		return await this.updateUserConsultationQuota(userId, {
			discountedConsultationsUsed: existing.discountedConsultationsUsed + 1,
		});
	}

	async incrementFreeConsultations(
		userId: string,
	): Promise<UserConsultationQuota> {
		const existing = await this.getUserConsultationQuota(userId);

		if (!existing) {
			return await this.createUserConsultationQuota({
				userId,
				discountedConsultationsUsed: 0,
				freeConsultationsUsed: 1,
			});
		}

		return await this.updateUserConsultationQuota(userId, {
			freeConsultationsUsed: existing.freeConsultationsUsed + 1,
		});
	}

	async getOrCreateUserConsultationQuota(
		userId: string,
		tx?: Tx,
	): Promise<UserConsultationQuota> {
		const existing = await this.getUserConsultationQuota(userId, tx);

		if (existing) {
			return existing;
		}

		return await this.createUserConsultationQuota(
			{
				userId,
				discountedConsultationsUsed: 0,
				freeConsultationsUsed: 0,
			},
			tx,
		);
	}
}
