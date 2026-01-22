import { db } from "../../../app/config/db";
import {
	eq,
	and,
	or,
	avg,
	sql,
	like,
	ilike,
	desc,
	asc,
	type SQL,
	inArray,
} from "drizzle-orm";
import {
	physicianSpecialties,
	physicianData,
	physicianRatings,
	physicianLocations,
	users,
} from "../../auth/models/user.schema";
import type {
	InsertPhysicianSpecialty,
	UpdatePhysicianSpecialty,
	PhysicianSpecialty,
	InsertPhysicianData,
	UpdatePhysicianData,
	PhysicianData,
	InsertPhysicianRating,
	InsertPhysicianLocation,
	UpdatePhysicianLocation,
	PhysicianLocation,
} from "../../auth/models/user.schema";
import { USER_ROLES } from "@shared/schema";

export class PhysicianRepository {
	// Specialty CRUD operations
	async getAllSpecialties(): Promise<PhysicianSpecialty[]> {
		return await db
			.select()
			.from(physicianSpecialties)
			.where(eq(physicianSpecialties.isActive, true))
			.orderBy(physicianSpecialties.name);
	}

	async getSpecialtyById(id: string): Promise<PhysicianSpecialty | null> {
		const [specialty] = await db
			.select()
			.from(physicianSpecialties)
			.where(eq(physicianSpecialties.id, id))
			.limit(1);

		return specialty || null;
	}

	async createSpecialty(
		data: InsertPhysicianSpecialty,
	): Promise<PhysicianSpecialty> {
		const [specialty] = await db
			.insert(physicianSpecialties)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		return specialty;
	}

	async updateSpecialty(
		id: string,
		data: UpdatePhysicianSpecialty,
	): Promise<PhysicianSpecialty> {
		const [specialty] = await db
			.update(physicianSpecialties)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(physicianSpecialties.id, id))
			.returning();

		if (!specialty) {
			throw new Error("Specialty not found");
		}

		return specialty;
	}

	async deleteSpecialty(id: string): Promise<void> {
		// Soft delete by setting isActive to false
		await db
			.update(physicianSpecialties)
			.set({
				isActive: false,
				updatedAt: new Date(),
			})
			.where(eq(physicianSpecialties.id, id));
	}

	// Physician Data operations
	async getPhysicianDataByUserId(
		userId: string,
	): Promise<PhysicianData | null> {
		const [data] = await db
			.select()
			.from(physicianData)
			.where(eq(physicianData.userId, userId))
			.limit(1);

		return data || null;
	}

	async createPhysicianData(data: InsertPhysicianData): Promise<PhysicianData> {
		const [physicianDataRecord] = await db
			.insert(physicianData)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		return physicianDataRecord;
	}

	async updatePhysicianData(
		userId: string,
		data: UpdatePhysicianData,
	): Promise<PhysicianData> {
		const [physicianDataRecord] = await db
			.update(physicianData)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(physicianData.userId, userId))
			.returning();

		if (!physicianDataRecord) {
			throw new Error("Physician data not found");
		}

		return physicianDataRecord;
	}

	async deletePhysicianData(userId: string): Promise<void> {
		await db.delete(physicianData).where(eq(physicianData.userId, userId));
	}

	// Get paginated physicians with search and specialty filter
	async getPhysiciansPaginated(params: {
		page: number;
		limit: number;
		skip?: number;
		search?: string;
		specialtyId?: string;
	}): Promise<{
		physicians: any[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	}> {
		const { page, limit, search, specialtyId, skip } = params;
		const offset = skip ? skip : (page - 1) * limit;

		// Build base query conditions
		const conditions = [
			eq(users.role, USER_ROLES.PHYSICIAN),
			eq(users.isActive, true),
		];

		// Add specialty filter if provided
		if (specialtyId) {
			conditions.push(eq(physicianData.specialtyId, specialtyId));
		}

		// Build search conditions if search term is provided
		let searchConditions: SQL<unknown>[] = [];
		if (search && search.trim() !== "" && search.toLowerCase() !== "all") {
			const searchTerm = `%${search.trim()}%`;
			searchConditions = [
				ilike(
					sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
					searchTerm,
				),
				ilike(physicianSpecialties.name, searchTerm),
			];
		}

		// Build final where conditions
		const finalConditions: SQL<unknown>[] = [...conditions];
		if (searchConditions.length > 0) {
			finalConditions.push(or(...searchConditions));
		}

		// Get total count for pagination
		const countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(users)
			.innerJoin(physicianData, eq(users.id, physicianData.userId))
			.innerJoin(
				physicianSpecialties,
				eq(physicianData.specialtyId, physicianSpecialties.id),
			)
			.where(and(...finalConditions));

		const [countResult] = await countQuery;
		const total = countResult?.count
			? parseInt(countResult.count.toString())
			: 0;
		const totalPages = Math.ceil(total / limit);

		// Get paginated physicians
		const query = db
			.select({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				isActive: users.isActive,
				specialtyId: physicianData.specialtyId,
				practiceStartDate: physicianData.practiceStartDate,
				consultationFee: physicianData.consultationFee,
				imageUrl: physicianData.imageUrl,
				specialty: physicianSpecialties.name,
			})
			.from(users)
			.innerJoin(physicianData, eq(users.id, physicianData.userId))
			.innerJoin(
				physicianSpecialties,
				eq(physicianData.specialtyId, physicianSpecialties.id),
			)
			.where(and(...finalConditions))
			.limit(limit)
			.offset(offset)
			.orderBy(asc(users.firstName), asc(users.lastName));

		const physicians = await query;

		// Get average ratings for each physician
		const physiciansWithRatings = await Promise.all(
			physicians.map(async (physician) => {
				const [avgRating] = await db
					.select({
						averageRating: avg(physicianRatings.rating),
						totalRatings: sql<number>`count(${physicianRatings.id})`,
					})
					.from(physicianRatings)
					.where(eq(physicianRatings.physicianId, physician.id));

				const rating = avgRating?.averageRating
					? parseFloat(avgRating.averageRating.toString())
					: 0;
				const totalRatings = avgRating?.totalRatings
					? parseInt(avgRating.totalRatings.toString())
					: 0;

				// Calculate years of experience
				const startDate = new Date(physician.practiceStartDate);
				const now = new Date();
				const yearsExperience = Math.max(
					1,
					Math.floor(
						(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
					),
				);

				return {
					...physician,
					rating: rating,
					totalRatings: totalRatings,
					experience: `${yearsExperience}+ years`,
				};
			}),
		);

		return {
			physicians: physiciansWithRatings,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};
	}

	// Get physicians by specialty for consultation
	async getPhysiciansBySpecialty(specialtyId: string) {
		const physicians = await db
			.select({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				isActive: users.isActive,
				specialtyId: physicianData.specialtyId,
				practiceStartDate: physicianData.practiceStartDate,
				consultationFee: physicianData.consultationFee,
				imageUrl: physicianData.imageUrl,
				specialty: physicianSpecialties.name,
			})
			.from(users)
			.innerJoin(physicianData, eq(users.id, physicianData.userId))
			.innerJoin(
				physicianSpecialties,
				eq(physicianData.specialtyId, physicianSpecialties.id),
			)
			.where(
				and(
					eq(physicianData.specialtyId, specialtyId),
					eq(users.role, USER_ROLES.PHYSICIAN),
					eq(users.isActive, true),
				),
			);

		// Get average ratings for each physician
		const physiciansWithRatings = await Promise.all(
			physicians.map(async (physician) => {
				const [avgRating] = await db
					.select({
						averageRating: avg(physicianRatings.rating),
						totalRatings: sql<number>`count(${physicianRatings.id})`,
					})
					.from(physicianRatings)
					.where(eq(physicianRatings.physicianId, physician.id));

				const rating = avgRating?.averageRating
					? parseFloat(avgRating.averageRating.toString())
					: 0;
				const totalRatings = avgRating?.totalRatings
					? parseInt(avgRating.totalRatings.toString())
					: 0;

				// Calculate years of experience
				const startDate = new Date(physician.practiceStartDate);
				const now = new Date();
				const yearsExperience = Math.floor(
					(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
				);

				return {
					...physician,
					rating: rating,
					totalRatings: totalRatings,
					experience: `${yearsExperience}+ years`,
				};
			}),
		);

		return physiciansWithRatings;
	}

	// Get all specialties for consultation page
	async getSpecialtiesForConsultation() {
		return await db
			.select({
				id: physicianSpecialties.id,
				name: physicianSpecialties.name,
				specialty: physicianSpecialties.name,
				icon: physicianSpecialties.icon,
			})
			.from(physicianSpecialties)
			.where(eq(physicianSpecialties.isActive, true))
			.orderBy(physicianSpecialties.name);
	}

	// Rating operations
	async createRating(data: InsertPhysicianRating): Promise<void> {
		await db.insert(physicianRatings).values({
			...data,
			updatedAt: new Date(),
		});
	}

	async getPhysicianAverageRating(
		physicianId: string,
	): Promise<{ averageRating: number; totalRatings: number }> {
		const [result] = await db
			.select({
				averageRating: avg(physicianRatings.rating),
				totalRatings: sql<number>`count(${physicianRatings.id})`,
			})
			.from(physicianRatings)
			.where(eq(physicianRatings.physicianId, physicianId));

		return {
			averageRating: result?.averageRating
				? parseFloat(result.averageRating.toString())
				: 0,
			totalRatings: result?.totalRatings
				? parseInt(result.totalRatings.toString())
				: 0,
		};
	}

	async setImageUrlFromFile(path: string, userId: string) {
		const [physicianDataRecord] = await db
			.update(physicianData)
			.set({
				imageUrl: path,
			})
			.where(eq(physicianData.userId, userId))
			.returning();

		return physicianDataRecord;
	}

	// Location operations
	async getAllLocationsByPhysicianId(
		physicianId: string,
	): Promise<PhysicianLocation[]> {
		return await db
			.select()
			.from(physicianLocations)
			.where(eq(physicianLocations.physicianId, physicianId))
			.orderBy(physicianLocations.createdAt);
	}

	async getLocationById(id: string): Promise<PhysicianLocation | null> {
		const [location] = await db
			.select()
			.from(physicianLocations)
			.where(eq(physicianLocations.id, id))
			.limit(1);
		return location || null;
	}

	async createLocation(
		data: InsertPhysicianLocation,
	): Promise<PhysicianLocation> {
		const [location] = await db
			.insert(physicianLocations)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();
		return location;
	}

	async updateLocation(
		id: string,
		data: UpdatePhysicianLocation,
	): Promise<PhysicianLocation> {
		const [location] = await db
			.update(physicianLocations)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(physicianLocations.id, id))
			.returning();
		return location;
	}

	async deleteLocation(id: string): Promise<void> {
		await db.delete(physicianLocations).where(eq(physicianLocations.id, id));
	}

	async getPhysicianByIds(physicianIds: string[]) {
		return await db
			.select({
				userId: physicianData.userId,
				specialty: physicianSpecialties.name,
			})
			.from(physicianData)
			.where(inArray(physicianData.userId, physicianIds))
			.innerJoin(
				physicianSpecialties,
				eq(physicianData.specialtyId, physicianSpecialties.id),
			);
	}
}
