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
	isNull,
	getTableColumns,
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
import {
	USER_ROLES,
	availabilityDate,
	bookedSlots,
	slots,
	slotType,
	slotTypeJunction,
	DateManager,
	slotLocations,
	SLOT_TYPE,
} from "@shared/schema";
import { gte } from "drizzle-orm";

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
		timeZone: string;
		date: string;
		dateWithTimezone: string;
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
		const {
			page,
			limit,
			search,
			specialtyId,
			skip,
			date,
			timeZone,
			dateWithTimezone,
		} = params;
		const offset = skip || 0;

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
			const orExpr = or(...searchConditions);
			if (orExpr) finalConditions.push(orExpr);
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
			physicians.map(async (physician) =>
				this.physicianWithRatingsAndNextAvaialbleSlot(physician, {
					timeZone,
					fromDate: dateWithTimezone,
				}),
			),
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

	// Get physicians by specialty with next available slot (earliest future unbooked slot per physician)
	async getPhysiciansBySpecialityAndNextAvailableSlot(
		specialtyId: string,
		timeZone: string,
		userDateISO: string,
		fromDate: string,
	) {
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

		const physiciansWithRatings = await Promise.all(
			physicians.map(async (physician) =>
				this.physicianWithRatingsAndNextAvaialbleSlot(physician, {
					timeZone,
					fromDate,
				}),
			),
		);

		return physiciansWithRatings.filter((p) => p.nextAvailableSlot !== null);
	}

	private getSlotTimeStamp(slot: { date: Date, startTime: string,  }, timeZone: string){
		const slotTimeIso = DateManager.getUtcFromLocal(slot.date, slot.startTime, timeZone)
		return new Date(slotTimeIso).getTime()
	}

	private async physicianWithRatingsAndNextAvaialbleSlot(
		physician: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
			isActive: boolean | null;
			specialtyId: string;
			practiceStartDate: Date;
			consultationFee: string;
			imageUrl: string | null;
			specialty: string;
		},
		{ timeZone, fromDate }: { timeZone: string; fromDate: string },
	) {
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

		const startDate = new Date(physician.practiceStartDate);
		const now = new Date();
		const yearsExperience = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
		);

		const nextSlotRows = await db
			.select({
				slotId: slots.id,
				date: availabilityDate.date,
				startTime: slots.startTime,
				endTime: slots.endTime,
				slotTypeId: slotType.id,
				slotType: slotType.type,
				slotLocation: {
					...getTableColumns(physicianLocations),
				},
			})
			.from(slots)
			.innerJoin(
				availabilityDate,
				eq(slots.availabilityId, availabilityDate.id),
			)
			.innerJoin(slotTypeJunction, eq(slotTypeJunction.slotId, slots.id))
			.innerJoin(slotType, eq(slotType.id, slotTypeJunction.slotTypeId))
			.leftJoin(bookedSlots, and(eq(bookedSlots.slotId, slots.id)))
			.leftJoin(slotLocations, eq(slotLocations.slotId, slots.id))
			.leftJoin(
				physicianLocations,
				eq(physicianLocations.id, slotLocations.locationId),
			)
			.where(
				and(
					eq(availabilityDate.physicianId, physician.id),
					sql`DATE(${availabilityDate.date}) >= DATE(${fromDate})`,
					isNull(bookedSlots.id),
				),
			)
			.orderBy(asc(availabilityDate.date))
			.limit(288)

		const userTimeStamp = new Date(fromDate).getTime();

		const filteredNextSlotRows = nextSlotRows
			.toSorted((slotA, slotB) => {
				const slotATimeStamp = this.getSlotTimeStamp(slotA, timeZone)
				const slotBTimeStamp = this.getSlotTimeStamp(slotB, timeZone)
				return slotATimeStamp - slotBTimeStamp
			})
			.filter((slot) => {
				const slotTimeStamp = this.getSlotTimeStamp(slot, timeZone)
				return slotTimeStamp > userTimeStamp;
			});

		const nextFilteredSlot = filteredNextSlotRows[0]
		const nextAvailableSlot =
				nextFilteredSlot ? {
						slotId: nextFilteredSlot.slotId,
						date: DateManager.formatDate(nextFilteredSlot.date),
						startTime:nextFilteredSlot.startTime,
						endTime: nextFilteredSlot.endTime,
						slotTypeId:  nextFilteredSlot.slotTypeId,
						slotType:
							  nextFilteredSlot.slotType === SLOT_TYPE.ONLINE
								? "Video Call"
								: "In Person",
						slotLocation: nextFilteredSlot.slotLocation,
					}
				: null;

		return {
			...physician,
			rating,
			totalRatings,
			experience: `${yearsExperience}+ years`,
			nextAvailableSlot,
		};
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
