import { db } from "../../../app/config/db";
import {
	type User,
	type InsertUser,
	type RefreshToken,
	type InsertRefreshToken,
	type PasswordResetToken,
	type InsertPasswordResetToken,
	users,
	refreshTokens,
	passwordResetTokens,
	physicianData,
	customerData,
	physicianSpecialties,
} from "../models/user.schema";
import { eq, and, getTableColumns, gt, gte, like, sql } from "drizzle-orm";

export class AuthRepository {

	private static readonly SIGN_IN_CODE_PREFIX = "SIC_";

	async getUser(id: string): Promise<User | undefined> {
		const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
		return user[0];
	}

	async getUserByEmail(email: string) {
		const user = await db
			.select({
				...getTableColumns(users),
				profileData: {
					...customerData,
					...physicianData,
					specialty: physicianSpecialties.name,
				},
			})
			.from(users)
			.where(eq(users.email, email))
			.limit(1)
			.leftJoin(customerData, eq(users.id, customerData.userId))
			.leftJoin(physicianData, eq(users.id, physicianData.userId))
			.leftJoin(
				physicianSpecialties,
				eq(physicianData.specialtyId, physicianSpecialties.id),
			);
		return user[0];
	}

	async createUser(user: InsertUser): Promise<User> {
		const newUser = await db.insert(users).values(user).returning();
		return newUser[0];
	}

	async createRefreshToken(
		tokenData: InsertRefreshToken,
	): Promise<RefreshToken> {
		const newRefreshToken = await db
			.insert(refreshTokens)
			.values(tokenData)
			.onConflictDoUpdate({
				target: refreshTokens.tokenId,
				set: {
					tokenId: tokenData.tokenId,
					expiresAt: tokenData.expiresAt,
				},
			})
			.returning();
		return newRefreshToken[0];
	}

	async removeRefreshToken(userId: string) {
		await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
	}

	async getRefreshToken(id: string): Promise<RefreshToken | undefined> {
		const refreshToken = await db
			.select()
			.from(refreshTokens)
			.where(and(eq(refreshTokens.tokenId, id)))
			.limit(1);
		const tokenData = refreshToken[0];
		// Check if token is expired
		if (tokenData && tokenData.expiresAt < new Date()) {
			return undefined;
		}

		return tokenData;
	}

	async revokeRefreshToken(id: string): Promise<void> {
		await db.delete(refreshTokens).where(eq(refreshTokens.tokenId, id));
	}

	async revokeAllUserTokens(userId: string): Promise<void> {
		await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
	}

	// Password reset token methods
	async createTokenForUser(
		tokenData: InsertPasswordResetToken,
	): Promise<PasswordResetToken> {
		const newToken = await db
			.insert(passwordResetTokens)
			.values(tokenData)
			.returning();
		return newToken[0];
	}

	async getPasswordResetToken(
		token: string,
	): Promise<PasswordResetToken | undefined> {
		const resetToken = await db
			.select()
			.from(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.token, token),
					eq(passwordResetTokens.used, false),
				),
			)
			.limit(1);
		return resetToken[0];
	}

	async markPasswordResetTokenAsUsed(token: string): Promise<void> {
		await db
			.update(passwordResetTokens)
			.set({ used: true })
			.where(eq(passwordResetTokens.token, token));
	}

	async revokeAllPasswordResetTokens(userId: string): Promise<void> {
		await db
			.update(passwordResetTokens)
			.set({ used: true })
			.where(eq(passwordResetTokens.userId, userId));
	}


	async countRecentSignInCodes(userId: string, since: Date): Promise<number> {
		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.userId, userId),
					like(passwordResetTokens.token, `${AuthRepository.SIGN_IN_CODE_PREFIX}%`),
					gte(passwordResetTokens.createdAt, since),
				),
			);
		return result[0]?.count ?? 0;
	}

	async revokeSignInCodesForUser(userId: string): Promise<void> {
		await db
			.delete(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.userId, userId),
					like(passwordResetTokens.token, `${AuthRepository.SIGN_IN_CODE_PREFIX}%`),
				),
			);
	}

	async getSignInCodeToken(tokenWithPrefix: string): Promise<
		| (PasswordResetToken & { userId: string })
		| undefined
	> {
		const row = await db
			.select()
			.from(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.token, tokenWithPrefix),
					eq(passwordResetTokens.used, false),
				),
			)
			.limit(1);
		const t = row[0];
		if (!t || t.expiresAt < new Date()) return undefined;
		return t;
	}

	async updateUserPassword(
		userId: string,
		hashedPassword: string,
	): Promise<void> {
		await db
			.update(users)
			.set({ password: hashedPassword, updatedAt: new Date() })
			.where(eq(users.id, userId));
	}

	// Admin methods
	async getAllUsers(): Promise<Omit<User, "password">[]> {
		const { password, ...userColumns } = getTableColumns(users);
		return await db.select(userColumns).from(users);
	}

	async getUserById(id: string): Promise<User | undefined> {
		const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
		return user[0];
	}

	async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
		const updatedUser = await db
			.update(users)
			.set({ ...updateData, updatedAt: new Date() })
			.where(eq(users.id, id))
			.returning();
		return updatedUser[0];
	}

	async deleteUser(id: string): Promise<void> {
		await db.delete(users).where(eq(users.id, id));
	}
}
