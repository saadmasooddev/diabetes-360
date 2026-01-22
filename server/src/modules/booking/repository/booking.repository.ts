import { db } from "../../../app/config/db";
import {
	eq,
	and,
	gte,
	lte,
	sql,
	inArray,
	or,
	like,
	ilike,
	type SQL,
	count,
	getTableColumns,
	notInArray,
} from "drizzle-orm";
import {
	slotSize,
	availabilityDate,
	slots,
	slotType,
	slotTypeJunction,
	slotPrice,
	bookedSlots,
	slotLocations,
	BOOKING_STATUS_ENUM,
	SLOT_TYPE,
} from "../models/booking.schema";
import {
	physicianLocations,
	users,
	physicianData,
	physicianRatings,
	physicianSpecialties,
} from "../../auth/models/user.schema";
import type {
	SlotSize,
	InsertAvailabilityDate,
	AvailabilityDate,
	InsertSlot,
	Slot,
	SlotType,
	InsertSlotTypeJunction,
	SlotTypeJunction,
	InsertSlotPrice,
	SlotPrice,
	UpdateSlotPrice,
	InsertBookedSlot,
	BookedSlot,
	InsertSlotLocation,
	SlotLocation,
} from "../models/booking.schema";
import { alias } from "drizzle-orm/pg-core";

export type DateSlotCount = { date: string; count: number };
export type DateWithBookings = {
	bookedSlots: DateSlotCount[];
	availableSlots: DateSlotCount[];
};

export type SlotStartEnd = { startTime: string; endTime: string }
export type UserConsultation = BookedSlot & {
				slot: Slot & {
					availability: AvailabilityDate;
					slotSize: SlotSize;
					slotType: SlotType;
					physician: {
						id: string;
						firstName: string;
						lastName: string;
						specialty?: string;
						imageUrl?: string | null;
						rating?: number;
					};
					location?: {
						locationName: string;
						address?: string | null;
						city?: string | null;
						state?: string | null;
						country?: string | null;
						postalCode?: string | null;
					} | null;
				};
			}


export type SlotWithDetails = {
	id: string;
	startTime: string;
	endTime: string;
	slotSize: number;
	isCustom: boolean;
	durationMinutes: number | null;
	types: Array<{ id: string; type: string }>;
	locations: Array<{
		locationName: string;
		address?: string | null;
		city?: string | null;
		state?: string | null;
		country?: string | null;
		postalCode?: string | null;
		latitude: string;
		longitude: string;
	}>;
	isBooked: boolean;
};
export class BookingRepository {
	// Slot Size operations
	async getAllSlotSizes(): Promise<SlotSize[]> {
		return await db.select().from(slotSize).orderBy(slotSize.size);
	}

	async getSlotSizeById(id: string): Promise<SlotSize | null> {
		const [size] = await db
			.select()
			.from(slotSize)
			.where(eq(slotSize.id, id))
			.limit(1);
		return size || null;
	}

	async getSlotSizeBySize(size: number): Promise<SlotSize | null> {
		const [sizeRecord] = await db
			.select()
			.from(slotSize)
			.where(eq(slotSize.size, size))
			.limit(1);
		return sizeRecord || null;
	}

	// Slot Type operations
	async getAllSlotTypes(): Promise<SlotType[]> {
		return await db.select().from(slotType).orderBy(slotType.type);
	}

	async getSlotTypeById(id: string): Promise<SlotType | null> {
		const [type] = await db
			.select()
			.from(slotType)
			.where(eq(slotType.id, id))
			.limit(1);
		return type || null;
	}

	async getSlotTypesByIds(ids: string[]): Promise<SlotType[]> {
		if(ids.length === 0) return []
		return await db
			.select()
			.from(slotType)
			.where(inArray(slotType.id, ids));
	}

	async getSlotTypeByType(type: string): Promise<SlotType | null> {
		const [typeRecord] = await db
			.select()
			.from(slotType)
			.where(eq(slotType.type, type))
			.limit(1);
		return typeRecord || null;
	}

	// Availability Date operations
	async createAvailabilityDate(
		data: Omit<InsertAvailabilityDate, "date"> & { date: string },
	): Promise<AvailabilityDate> {
		const [availability] = await db
			.insert(availabilityDate)
			.values({
				...data,
				date: sql<Date>`DATE(${data.date})`,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [availabilityDate.physicianId, availabilityDate.date],
				set: {
					updatedAt: new Date(),
				},
			})
			.returning();
		return availability;
	}

	async getAvailabilityDateByPhysicianAndDate(
		physicianId: string,
		date: string,
	): Promise<AvailabilityDate | null> {
		const [availability] = await db
			.select({
				...getTableColumns(availabilityDate),
				date: sql<Date>`DATE(${availabilityDate.date})`,
			})
			.from(availabilityDate)
			.where(
				and(
					eq(availabilityDate.physicianId, physicianId),
					sql`DATE(${availabilityDate.date}) = DATE(${date})`,
				),
			)
			.limit(1);
		return availability || null;
	}

	async getAvailabilityDatesByPhysician(
		physicianId: string,
	): Promise<AvailabilityDate[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return await db
			.select()
			.from(availabilityDate)
			.where(
				and(
					eq(availabilityDate.physicianId, physicianId),
					gte(availabilityDate.date, today),
				),
			)
			.orderBy(availabilityDate.date);
	}

	async getAvailabilityDateById(id: string): Promise<AvailabilityDate | null> {
		const [availability] = await db
			.select()
			.from(availabilityDate)
			.where(eq(availabilityDate.id, id))
			.limit(1);
		return availability || null;
	}

	// Slot operations
	async createSlot(data: InsertSlot): Promise<Slot> {
		const [slot] = await db
			.insert(slots)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();
		return slot;
	}

	async createMultipleSlots(slotsData: InsertSlot[]): Promise<Slot[]> {
		if (slotsData.length === 0) return [];
		const insertedSlots = await db
			.insert(slots)
			.values(slotsData.map((slot) => ({ ...slot, updatedAt: new Date() })))
			.returning();
		return insertedSlots;
	}

	async getSlotById(id: string): Promise<Slot | null> {
		const [slot] = await db
			.select()
			.from(slots)
			.where(eq(slots.id, id))
			.limit(1);
		return slot || null;
	}

	async getSlotsByAvailabilityId(availabilityId: string): Promise<Slot[]> {
		return await db
			.select()
			.from(slots)
			.where(eq(slots.availabilityId, availabilityId))
			.orderBy(slots.startTime);
	}

	async deleteSlot(id: string): Promise<void> {
		await db.delete(slots).where(eq(slots.id, id));
	}

	async updateSlot(
		slotId: string,
		data: {
			startTime?: string;
			endTime?: string;
		},
	): Promise<Slot> {
		const [updated] = await db
			.update(slots)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(slots.id, slotId))
			.returning();
		return updated;
	}

	async updateSlotTypes(
		slotId: string,
		slotTypeIds: string[],
	): Promise<SlotTypeJunction[]> {
		// Delete existing type junctions
		await this.deleteSlotTypeJunctionsBySlotId(slotId);

		// Create new type junctions
		if (slotTypeIds.length === 0) return [];
		const junctionData: InsertSlotTypeJunction[] = slotTypeIds.map((typeId) => ({
			slotId,
			slotTypeId: typeId,
		}));
		return await this.createMultipleSlotTypeJunctions(junctionData);
	}

	async getSlotWithDetails(id: string): Promise<SlotWithDetails | null> {
		const [slot] = await db
			.select()
			.from(slots)
			.where(eq(slots.id, id))
			.limit(1);

		if (!slot) return null;

		const [slotSizeRecord] = await db
			.select()
			.from(slotSize)
			.where(eq(slotSize.id, slot.slotSizeId))
			.limit(1);


		const typeJunctions = await db
			.select()
			.from(slotTypeJunction)
			.where(eq(slotTypeJunction.slotId, slot.id));

		const typeIds = typeJunctions.map((j) => j.slotTypeId);
		const types =
			typeIds.length > 0
				? await db.select().from(slotType).where(inArray(slotType.id, typeIds))
				: [];

		const [booked] = await db
			.select()
			.from(bookedSlots)
			.where(
				and(
					eq(bookedSlots.slotId, slot.id),
					or(
						eq(bookedSlots.status, "pending"),
						eq(bookedSlots.status, "confirmed"),
					),
				),
			)
			.limit(1);

		// Get slot locations
		const slotLocationRecords = await this.getSlotLocationsBySlotId(slot.id);
		const locations = slotLocationRecords.map((sl) => sl.location);
		const startMinutes = this.timeToMinutes(slot.startTime);
		const endMinutes = this.timeToMinutes(slot.endTime);

		const durationMinutes = endMinutes - startMinutes;


		return {
			...slot,
			slotSize: slotSizeRecord!.size, // Keep reference slot size
			isCustom: slot.isCustom ?? false,
			durationMinutes: durationMinutes ?? null,
			types,
			locations,
			isBooked: !!booked,
		};
	}

	// Slot Type Junction operations
	async createSlotTypeJunction(
		data: InsertSlotTypeJunction,
	): Promise<SlotTypeJunction> {
		const [junction] = await db
			.insert(slotTypeJunction)
			.values(data)
			.returning();
		return junction;
	}

	async createMultipleSlotTypeJunctions(
		junctions: InsertSlotTypeJunction[],
	): Promise<SlotTypeJunction[]> {
		if (junctions.length === 0) return [];
		return await db.insert(slotTypeJunction).values(junctions).returning();
	}

	async getSlotTypeJunctionsBySlotId(
		slotId: string,
	): Promise<SlotTypeJunction[]> {
		return await db
			.select()
			.from(slotTypeJunction)
			.where(eq(slotTypeJunction.slotId, slotId));
	}

	async deleteSlotTypeJunctionsBySlotId(slotId: string): Promise<void> {
		await db
			.delete(slotTypeJunction)
			.where(eq(slotTypeJunction.slotId, slotId));
	}

	// Slot Price operations
	async createSlotPrice(data: InsertSlotPrice): Promise<SlotPrice> {
		const [price] = await db
			.insert(slotPrice)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();
		return price;
	}

	async createMultipleSlotPrices(
		prices: InsertSlotPrice[],
	): Promise<SlotPrice[]> {
		if (prices.length === 0) return [];
		return await db
			.insert(slotPrice)
			.values(prices.map((p) => ({ ...p, updatedAt: new Date() })))
			.returning();
	}

	async updateSlotPrice(id: string, data: UpdateSlotPrice): Promise<SlotPrice> {
		const [price] = await db
			.update(slotPrice)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(slotPrice.id, id))
			.returning();
		return price;
	}

	async getSlotPriceById(id: string): Promise<SlotPrice | null> {
		const [price] = await db
			.select()
			.from(slotPrice)
			.where(eq(slotPrice.id, id))
			.limit(1);
		return price || null;
	}

	async getSlotPricesBySlotId(slotId: string): Promise<SlotPrice[]> {
		return await db
			.select()
			.from(slotPrice)
			.where(eq(slotPrice.slotId, slotId));
	}

	// Booked Slot operations
	async createBookedSlot(data: InsertBookedSlot): Promise<BookedSlot> {
		const [booked] = await db
			.insert(bookedSlots)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();
		return booked;
	}

	async getBookedSlotById(id: string): Promise<BookedSlot | null> {
		const [booked] = await db
			.select()
			.from(bookedSlots)
			.where(eq(bookedSlots.id, id))
			.limit(1);
		return booked || null;
	}

	async isSlotBooked(slotId: string): Promise<boolean> {
		const [booked] = await db
			.select()
			.from(bookedSlots)
			.where(
				and(
					eq(bookedSlots.slotId, slotId),
					or(
						eq(bookedSlots.status, "pending"),
						eq(bookedSlots.status, "confirmed"),
					),
				),
			)
			.limit(1);
		return !!booked;
	}

	async getBookedSlotsBySlotId(slotId: string): Promise<BookedSlot[]> {
		return await db
			.select()
			.from(bookedSlots)
			.where(eq(bookedSlots.slotId, slotId))
			.orderBy(bookedSlots.createdAt);
	}

	// Get available slots for a physician on a date
	async getAvailableSlotsForDate(
		physicianId: string,
		date: string,
	): Promise<
		Array<
			Slot & {
				slotSize: SlotSize;
				prices: Array<SlotPrice & { slotType: SlotType }>;
				types: SlotType[];
				locations: Array<typeof physicianLocations.$inferSelect>;
				isBooked: boolean;
			}
		>
	> {
		const availability = await this.getAvailabilityDateByPhysicianAndDate(
			physicianId,
			date,
		);

		if (!availability) return [];

		const slotsList = await this.getSlotsByAvailabilityId(availability.id);
		const slotIds = slotsList.map((s) => s.id);

		if (slotIds.length === 0) return [];

		const bookedSlotIds = await db
			.select({ slotId: bookedSlots.slotId })
			.from(bookedSlots)
			.where(
				and(
					inArray(bookedSlots.slotId, slotIds),
					or(
						eq(bookedSlots.status, "pending"),
						eq(bookedSlots.status, "confirmed"),
					),
				),
			);

		const bookedIds = new Set(bookedSlotIds.map((b) => b.slotId));

		const slotSizes = await db
			.select()
			.from(slotSize)
			.where(
				inArray(
					slotSize.id,
					slotsList.map((s) => s.slotSizeId),
				),
			);

		const sizeMap = new Map(slotSizes.map((s) => [s.id, s]));

		const prices = await db
			.select()
			.from(slotPrice)
			.where(inArray(slotPrice.slotId, slotIds));

		const typeJunctions = await db
			.select()
			.from(slotTypeJunction)
			.where(inArray(slotTypeJunction.slotId, slotIds));

		const typeIds = [
			...Array.from(new Set(typeJunctions.map((j) => j.slotTypeId))),
		];
		const types =
			typeIds.length > 0
				? await db.select().from(slotType).where(inArray(slotType.id, typeIds))
				: [];

		const typeMap = new Map(types.map((t) => [t.id, t]));
		const junctionMap = new Map<string, string[]>();
		typeJunctions.forEach((j) => {
			if (!junctionMap.has(j.slotId)) {
				junctionMap.set(j.slotId, []);
			}
			junctionMap.get(j.slotId)!.push(j.slotTypeId);
		});

		type SlotPriceWithType = SlotPrice & { slotType: SlotType };

		const priceMap = new Map<string, SlotPriceWithType[]>();
		prices.forEach((p) => {
			if (!priceMap.has(p.slotId)) {
				priceMap.set(p.slotId, []);
			}
			priceMap
				.get(p.slotId)!
				.push({ ...p, slotType: typeMap.get(p.slotTypeId)! });
		});

		// Get locations for all slots
		const slotLocationRecords = await db
			.select({
				slotId: slotLocations.slotId,
				location: physicianLocations,
			})
			.from(slotLocations)
			.innerJoin(
				physicianLocations,
				eq(slotLocations.locationId, physicianLocations.id),
			)
			.where(inArray(slotLocations.slotId, slotIds));

		const locationMap = new Map<
			string,
			Array<typeof physicianLocations.$inferSelect>
		>();
		slotLocationRecords.forEach((sl) => {
			if (!locationMap.has(sl.slotId)) {
				locationMap.set(sl.slotId, []);
			}
			locationMap.get(sl.slotId)!.push(sl.location);
		});

		return slotsList.map((slot) => ({
			...slot,
			isCustom: slot.isCustom ?? false,
			slotSize: sizeMap.get(slot.slotSizeId)!,
			prices: priceMap.get(slot.id) || [],
			types: (junctionMap.get(slot.id) || []).map((tid) => typeMap.get(tid)!),
			locations: locationMap.get(slot.id) || [],
			isBooked: bookedIds.has(slot.id),
		}));
	}

	// Get dates with availability for a physician
	async getDatesWithAvailability(physicianId: string): Promise<Date[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const availabilities = await db
			.select()
			.from(availabilityDate)
			.where(
				and(
					eq(availabilityDate.physicianId, physicianId),
					gte(availabilityDate.date, today),
				),
			)
			.orderBy(availabilityDate.date);

		return availabilities.map((a) => new Date(a.date));
	}

	// Check for overlapping slots
	async checkOverlappingSlots(
		availabilityId: string,
		startTime: string,
		endTime: string,
		slotTypeIds: string[],
		excludeSlotId?: string,
	): Promise<boolean> {
		const existingSlots = await db
			.select()
			.from(slots)
			.where(eq(slots.availabilityId, availabilityId));

		const filteredSlots = excludeSlotId
			? existingSlots.filter((s) => s.id !== excludeSlotId)
			: existingSlots;

		if (filteredSlots.length === 0) return false;

		const slotIds = filteredSlots.map((s) => s.id);
		const typeJunctions = await db
			.select()
			.from(slotTypeJunction)
			.where(inArray(slotTypeJunction.slotId, slotIds));

		const slotsWithTypes = filteredSlots.map((slot) => ({
			...slot,
			typeIds: typeJunctions
				.filter((j) => j.slotId === slot.id)
				.map((j) => j.slotTypeId),
		}));

		const startMinutes = this.timeToMinutes(startTime);
		const endMinutes = this.timeToMinutes(endTime);

		for (const slot of slotsWithTypes) {
			const slotStartMinutes = this.timeToMinutes(slot.startTime);
			const slotEndMinutes = this.timeToMinutes(slot.endTime);

			// Check if time ranges overlap
			const timeOverlaps =
				(startMinutes < slotEndMinutes && endMinutes > slotStartMinutes) ||
				(slotStartMinutes < endMinutes && slotEndMinutes > startMinutes);

			// If time overlaps, prevent creating new slots regardless of type
			// This ensures no overlapping time slots can be created, even with different types
			if (timeOverlaps) {
				return true; // Overlapping found - time conflict regardless of type
			}
		}

		return false;
	}

	private timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(":").map(Number);
		return hours * 60 + minutes;
	}

	private minutesToTime(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
	}

	// Slot Location operations
	async createSlotLocation(data: InsertSlotLocation): Promise<SlotLocation> {
		const [slotLocation] = await db
			.insert(slotLocations)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();
		return slotLocation;
	}

	async createMultipleSlotLocations(
		locations: InsertSlotLocation[],
	): Promise<SlotLocation[]> {
		if (locations.length === 0) return [];
		return await db
			.insert(slotLocations)
			.values(locations.map((l) => ({ ...l, updatedAt: new Date() })))
			.returning();
	}

	async getSlotLocationsBySlotId(slotId: string) {
		return await db
			.select({
				id: slotLocations.id,
				slotId: slotLocations.slotId,
				locationId: slotLocations.locationId,
				location: physicianLocations,
			})
			.from(slotLocations)
			.innerJoin(
				physicianLocations,
				eq(slotLocations.locationId, physicianLocations.id),
			)
			.where(eq(slotLocations.slotId, slotId));
	}

	async deleteSlotLocationsBySlotId(slotId: string): Promise<void> {
		await db.delete(slotLocations).where(eq(slotLocations.slotId, slotId));
	}

	async updateSlotLocations(
		slotId: string,
		locationIds: string[],
	): Promise<SlotLocation[]> {
		// Delete existing locations
		await this.deleteSlotLocationsBySlotId(slotId);

		// Create new locations
		if (locationIds.length === 0) return [];
		const insertData: InsertSlotLocation[] = locationIds.map((locationId) => ({
			slotId,
			locationId,
		}));
		return await this.createMultipleSlotLocations(insertData);
	}

	// Get dates with available booking counts for a specific month/year
	async getDatesWithCountsForMonth(
		physicianId: string,
		month: number,
		year: number,
	): Promise<Array<{ date: string; count: number }>> {
		if (month < 1 || month > 12) {
			return [];
		}

		// Calculate start and end of month
		const startDate = new Date(year, month - 1, 1);
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(year, month, 0, 23, 59, 59, 999);

		// Get all availability dates for the month
		const availabilities = await db
			.select()
			.from(availabilityDate)
			.where(
				and(
					eq(availabilityDate.physicianId, physicianId),
					gte(availabilityDate.date, startDate),
					lte(availabilityDate.date, endDate),
				),
			)
			.orderBy(availabilityDate.date);

		if (availabilities.length === 0) {
			return [];
		}

		const availabilityIds = availabilities.map((a) => a.id);

		// Get all slots for these availabilities
		const allSlots = await db
			.select()
			.from(slots)
			.where(inArray(slots.availabilityId, availabilityIds));

		if (allSlots.length === 0) {
			return availabilities.map((a) => ({
				date: new Date(a.date).toISOString().split("T")[0],
				count: 0,
			}));
		}

		const slotIds = allSlots.map((s) => s.id);

		// Get booked slots (pending or confirmed)
		const bookedSlotsResult = await db
			.select({ slotId: bookedSlots.slotId })
			.from(bookedSlots)
			.where(
				and(
					inArray(bookedSlots.slotId, slotIds),
					or(
						eq(bookedSlots.status, "pending"),
						eq(bookedSlots.status, "confirmed"),
					),
				),
			);

		const bookedSlotIds = new Set(bookedSlotsResult.map((b) => b.slotId));

		// Count available slots per date
		const slotMap = new Map<string, number>();
		allSlots.forEach((slot) => {
			const availability = availabilities.find(
				(a) => a.id === slot.availabilityId,
			);
			if (availability) {
				const dateStr = new Date(availability.date).toISOString().split("T")[0];
				if (!slotMap.has(dateStr)) {
					slotMap.set(dateStr, 0);
				}
				// Only count if slot is not booked
				if (!bookedSlotIds.has(slot.id)) {
					slotMap.set(dateStr, slotMap.get(dateStr)! + 1);
				}
			}
		});

		// Return dates with counts
		return availabilities.map((a) => {
			const dateStr = new Date(a.date).toISOString().split("T")[0];
			return {
				date: dateStr,
				count: slotMap.get(dateStr) || 0,
			};
		});
	}

	// Get organized slots for a specific date (without unnecessary fields)
	async getOrganizedSlotsForDate(
		physicianId: string,
		date: string,
	): Promise<SlotWithDetails[]> {
		const availability = await this.getAvailabilityDateByPhysicianAndDate(
			physicianId,
			date,
		);

		if (!availability) {
			return [];
		}

		const slotsList = await this.getSlotsByAvailabilityId(availability.id);
		if (slotsList.length === 0) {
			return [];
		}

		const slotIds = slotsList.map((s) => s.id);

		// Get slot sizes
		const slotSizes = await db
			.select()
			.from(slotSize)
			.where(
				inArray(
					slotSize.id,
					slotsList.map((s) => s.slotSizeId),
				),
			);
		const sizeMap = new Map(slotSizes.map((s) => [s.id, s.size]));

		const typeJunctions = await db
			.select()
			.from(slotTypeJunction)
			.where(inArray(slotTypeJunction.slotId, slotIds));

		const typeIds = Array.from(new Set(typeJunctions.map((j) => j.slotTypeId)));
		const types =
			typeIds.length > 0
				? await db.select().from(slotType).where(inArray(slotType.id, typeIds))
				: [];
		const typeMap = new Map(
			types.map((t) => [t.id, { id: t.id, type: t.type }]),
		);

		// Get booked slots
		const bookedSlotsResult = await db
			.select({ slotId: bookedSlots.slotId })
			.from(bookedSlots)
			.where(
				and(
					inArray(bookedSlots.slotId, slotIds),
					or(
						eq(bookedSlots.status, "pending"),
					),
				),
			);
		const bookedSlotIds = new Set(bookedSlotsResult.map((b) => b.slotId));

		// Get locations
		const slotLocationRecords = await db
			.select({
				slotId: slotLocations.slotId,
				location: physicianLocations,
			})
			.from(slotLocations)
			.innerJoin(
				physicianLocations,
				eq(slotLocations.locationId, physicianLocations.id),
			)
			.where(inArray(slotLocations.slotId, slotIds));

		const locationMap = new Map<
			string,
			Array<typeof physicianLocations.$inferSelect>
		>();
		slotLocationRecords.forEach((sl) => {
			if (!locationMap.has(sl.slotId)) {
				locationMap.set(sl.slotId, []);
			}
			locationMap.get(sl.slotId)!.push(sl.location);
		});

		// Organize type map
		const typesMap = new Map<string, { id: string; type: string }[]>();
		typeJunctions.forEach((j) => {
			if (!typesMap.has(j.slotId)) {
				typesMap.set(j.slotId, []);
			}
			const slotType = typeMap.get(j.slotTypeId);
			if (slotType) {
				typesMap.get(j.slotId)!.push({ id: slotType.id, type: slotType.type });
			}
		});

		// Build organized response
		return slotsList.map((slot) => {
			const slotLocations = locationMap.get(slot.id) || [];
			const organizedLocations =
				slotLocations.length > 0
					? slotLocations.map((loc) => ({
							locationName: loc.locationName,
							address: loc.address,
							city: loc.city,
							state: loc.state,
							country: loc.country,
							postalCode: loc.postalCode,
							latitude: loc.latitude,
							longitude: loc.longitude,
						}))
					: [];

			const types = typesMap.get(slot.id) || [];

			return {
				id: slot.id,
				startTime: slot.startTime,
				endTime: slot.endTime,
				slotSize: sizeMap.get(slot.slotSizeId) || 0,
				types,
				locations: organizedLocations,
				isBooked: bookedSlotIds.has(slot.id),
			};
		});
	}

	// Get user consultations (upcoming and past)
	async getUserConsultations(
		customerId: string,
		options: {
			type?: "upcoming" | "past";
			page?: number;
			limit?: number;
			skip?: number;
			physicianId?: string;
		} = {},
	): Promise<{
		consultations: Array<UserConsultation>;
		total: number;
		page: number;
		limit: number;
	}> {
		const { type, page = 1, limit = 10, skip, physicianId } = options;
		const offset = skip ? skip : (page - 1) * limit;

		// Base query conditions
		let statusCondition = or(
			eq(bookedSlots.status, "pending"),
			eq(bookedSlots.status, "confirmed"),
			eq(bookedSlots.status, "completed"),
		);

		if (type === "upcoming") {
			statusCondition = or(
				eq(bookedSlots.status, "pending"),
				eq(bookedSlots.status, "confirmed"),
			);
		} else if (type === "past") {
			statusCondition = eq(bookedSlots.status, "completed");
		}

		// Get total count
		const totalResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(bookedSlots)
			.where(and(eq(bookedSlots.customerId, customerId), statusCondition));
		const total = Number(totalResult[0]?.count || 0);

		// Get booked slots with related data
		// First get all bookings
		const allBookings = await db
			.select()
			.from(bookedSlots)
			.where(and(eq(bookedSlots.customerId, customerId), statusCondition));

		// Get slots and availability dates for ordering
		if (allBookings.length === 0) {
			return { consultations: [], total, page, limit };
		}

		const slotIdsForOrdering = allBookings.map((b) => b.slotId);
		const slotsForOrdering = await db
			.select()
			.from(slots)
			.where(inArray(slots.id, slotIdsForOrdering));
		const availabilityIdsForOrdering = slotsForOrdering.map(
			(s) => s.availabilityId,
		);
		const availabilitiesForOrdering = await db
			.select()
			.from(availabilityDate)
			.where(inArray(availabilityDate.id, availabilityIdsForOrdering));

		const slotToAvailabilityMap = new Map<string, Date>();
		slotsForOrdering.forEach((slot) => {
			const availability = availabilitiesForOrdering.find(
				(a) => a.id === slot.availabilityId,
			);
			if (availability) {
				slotToAvailabilityMap.set(slot.id, new Date(availability.date));
			}
		});

		// Sort bookings by date
		const sortedBookings = allBookings.sort((a, b) => {
			const dateA = slotToAvailabilityMap.get(a.slotId) || new Date(0);
			const dateB = slotToAvailabilityMap.get(b.slotId) || new Date(0);
			if (type === "upcoming") {
				return dateA.getTime() - dateB.getTime();
			} else {
				return dateB.getTime() - dateA.getTime();
			}
		});

		// Apply pagination
		const bookings = sortedBookings.slice(offset, offset + limit);

		if (bookings.length === 0) {
			return { consultations: [], total, page, limit };
		}

		// Get all related data
		const slotIds = bookings.map((b) => b.slotId);
		const slotsData = await db
			.select()
			.from(slots)
			.where(inArray(slots.id, slotIds));
		const slotMap = new Map(slotsData.map((s) => [s.id, s]));

		const availabilityIds = slotsData.map((s) => s.availabilityId);
		const availabilitiesConditions: SQL<unknown>[] = [
			inArray(availabilityDate.id, availabilityIds),
		];

		if (physicianId) {
			availabilitiesConditions.push(
				eq(availabilityDate.physicianId, physicianId),
			);
		}

		const availabilities = await db
			.select()
			.from(availabilityDate)
			.where(and(...availabilitiesConditions));
		const availabilityMap = new Map(availabilities.map((a) => [a.id, a]));

		const slotSizeIds = slotsData.map((s) => s.slotSizeId);
		const slotSizes = await db
			.select()
			.from(slotSize)
			.where(inArray(slotSize.id, slotSizeIds));
		const slotSizeMap = new Map(slotSizes.map((s) => [s.id, s]));

		const slotTypeIds = bookings.map((b) => b.slotTypeId);
		const slotTypes = await db
			.select()
			.from(slotType)
			.where(inArray(slotType.id, slotTypeIds));
		const slotTypeMap = new Map(slotTypes.map((t) => [t.id, t]));

		// Get physician data
		const physicianIds = availabilities.map((a) => a.physicianId);
		const physicians = await db
			.select({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
			})
			.from(users)
			.where(inArray(users.id, physicianIds));

		const physicianDataRecords = await db
			.select()
			.from(physicianData)
			.where(inArray(physicianData.userId, physicianIds));

		// Get specialties
		const specialtyIds = physicianDataRecords.map((pd) => pd.specialtyId);
		const specialties =
			specialtyIds.length > 0
				? await db
						.select()
						.from(physicianSpecialties)
						.where(inArray(physicianSpecialties.id, specialtyIds))
				: [];
		const specialtyMap = new Map(specialties.map((s) => [s.id, s.name]));

		// Get physician ratings
		const ratings = await db
			.select({
				physicianId: physicianRatings.physicianId,
				avgRating: sql<number>`COALESCE(AVG(${physicianRatings.rating})::numeric, 0)`,
			})
			.from(physicianRatings)
			.where(inArray(physicianRatings.physicianId, physicianIds))
			.groupBy(physicianRatings.physicianId);

		const ratingMap = new Map(
			ratings.map((r) => [r.physicianId, Number(r.avgRating)]),
		);

		// Get locations for slots
		const slotLocationRecords = await db
			.select()
			.from(slotLocations)
			.where(inArray(slotLocations.slotId, slotIds));

		const locationIds = slotLocationRecords.map((sl) => sl.locationId);
		const locations =
			locationIds.length > 0
				? await db
						.select()
						.from(physicianLocations)
						.where(inArray(physicianLocations.id, locationIds))
				: [];
		const locationMap = new Map(locations.map((l) => [l.id, l]));
		const slotLocationMap = new Map(
			slotLocationRecords.map((sl) => [sl.slotId, sl.locationId]),
		);

		// Build consultations array
		const consultations = bookings.map((booking) => {
			const slot = slotMap.get(booking.slotId);
			if (!slot) throw new Error(`Slot ${booking.slotId} not found`);

			const availability = availabilityMap.get(slot.availabilityId);
			if (!availability)
				throw new Error(`Availability ${slot.availabilityId} not found`);

			const slotSizeRecord = slotSizeMap.get(slot.slotSizeId);
			if (!slotSizeRecord)
				throw new Error(`Slot size ${slot.slotSizeId} not found`);

			const slotTypeRecord = slotTypeMap.get(booking.slotTypeId);
			if (!slotTypeRecord)
				throw new Error(`Slot type ${booking.slotTypeId} not found`);

			const physician = physicians.find(
				(p) => p.id === availability.physicianId,
			);
			if (!physician)
				throw new Error(`Physician ${availability.physicianId} not found`);

			const physicianDataRecord = physicianDataRecords.find(
				(pd) => pd.userId === physician.id,
			);
			const locationId = slotLocationMap.get(slot.id);
			const location = locationId ? locationMap.get(locationId) : null;

			return {
				...booking,
				slot: {
					...slot,
					availability,
					slotSize: slotSizeRecord,
					slotType: slotTypeRecord,
					physician: {
						id: physician.id,
						firstName: physician.firstName,
						lastName: physician.lastName,
						specialty: physicianDataRecord
							? specialtyMap.get(physicianDataRecord.specialtyId) || undefined
							: undefined,
						imageUrl: physicianDataRecord?.imageUrl || null,
						rating: ratingMap.get(physician.id) || 0,
					},
					location: location
						? {
								locationName: location.locationName,
								address: location.address,
								city: location.city,
								state: location.state,
								country: location.country,
								postalCode: location.postalCode,
							}
						: null,
				},
			};
		});

		return { consultations, total, page, limit };
	}

	// Update consultation attended status
	async markConsultationAttended(
		bookingId: string,
		customerId: string,
	): Promise<BookedSlot> {
		const [updated] = await db
			.update(bookedSlots)
			.set({ status: "completed", updatedAt: new Date() })
			.where(
				and(
					eq(bookedSlots.id, bookingId),
					eq(bookedSlots.customerId, customerId),
				),
			)
			.returning();
		if (!updated) {
			throw new Error("Booking not found or unauthorized");
		}
		return updated;
	}

	// Update consultation summary (for physician)
	async updateConsultationSummary(
		bookingId: string,
		summary: string,
		physicianId: string,
	): Promise<BookedSlot> {
		// Verify the booking belongs to this physician
		const booking = await this.getBookedSlotById(bookingId);
		if (!booking) {
			throw new Error("Booking not found");
		}

		const slot = await this.getSlotById(booking.slotId);
		if (!slot) {
			throw new Error("Slot not found");
		}

		const availability = await this.getAvailabilityDateById(
			slot.availabilityId,
		);
		if (!availability || availability.physicianId !== physicianId) {
			throw new Error("Unauthorized: This booking does not belong to you");
		}

		const [updated] = await db
			.update(bookedSlots)
			.set({ summary, updatedAt: new Date() })
			.where(eq(bookedSlots.id, bookingId))
			.returning();

		if (!updated) {
			throw new Error("Failed to update summary");
		}
		return updated;
	}

	// Get dates with bookings for calendar view
	async getDatesWithBookings(
		physicianId: string | null,
		hasReadAllAppointments: boolean,
		month: number,
		year: number,
	): Promise<DateWithBookings> {
		const startDate = new Date(year, month - 1, 1);
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(year, month, 0, 23, 59, 59, 999);

		const statusCondition = or(
			eq(bookedSlots.status, BOOKING_STATUS_ENUM.PENDING),
			eq(bookedSlots.status, BOOKING_STATUS_ENUM.CONFIRMED),
		);

		const dateContition = [
			sql`DATE(${availabilityDate.date}) >= DATE(${startDate})`,
			sql`DATE(${availabilityDate.date}) <= DATE(${endDate})`,
		];

		const conditions: SQL<unknown>[] = [...dateContition];

		if (statusCondition) {
			conditions.push(statusCondition);
		}

		if (physicianId && !hasReadAllAppointments) {
			conditions.push(eq(availabilityDate.physicianId, physicianId));
		}

		const bookings = await db
			.select({
				slotId: sql<string>`MAX(${bookedSlots.slotId})`,
				date: sql<string>`DATE(${availabilityDate.date})`,
				count: count(),
			})
			.from(bookedSlots)
			.innerJoin(slots, eq(bookedSlots.slotId, slots.id))
			.innerJoin(
				availabilityDate,
				eq(slots.availabilityId, availabilityDate.id),
			)
			.where(and(...conditions))
			.groupBy(availabilityDate.date);

		const availableSlotsConditions = [
			...dateContition,
			notInArray(
				slots.id,
				bookings.map((b) => b.slotId),
			),
		];

		if (physicianId && !hasReadAllAppointments) {
			availableSlotsConditions.push(
				eq(availabilityDate.physicianId, physicianId),
			);
		}

		const availableSlots = await db
			.select({
				date: sql<string>`Date(${availabilityDate.date})`,
				count: count(),
			})
			.from(slots)
			.innerJoin(
				availabilityDate,
				eq(slots.availabilityId, availabilityDate.id),
			)
			.where(and(...availableSlotsConditions))
			.groupBy(availabilityDate.date);

		return {
			bookedSlots: bookings,
			availableSlots: availableSlots,
		};
	}

	async generateSlotsForDay(
		physicianId: string,
		date: string,
		slotSizeId: string,
	): Promise<{
		availableSlots: Array<SlotStartEnd>;
		existingSlots: Slot[];
		conflicts: Array<SlotStartEnd>;
	}> {
		const slotSize = await this.getSlotSizeById(slotSizeId);
		if (!slotSize) {
			throw new Error("Slot size not found");
		}

		let availability = await this.getAvailabilityDateByPhysicianAndDate(
			physicianId,
			date,
		);
		if (!availability) {
			availability = await this.createAvailabilityDate({
				physicianId,
				date: date,
			});
		}

		// Get existing slots for this date
		const existingSlots = await this.getSlotsByAvailabilityId(availability.id);

		// Generate all possible slots for the day
		const dateObj = new Date(date)
		const allSlots: Array<SlotStartEnd> = [];
		const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes()
		let startMinutes = Math.ceil(currentMinutes/ slotSize.size) * slotSize.size; // 12:00 AM
		const endMinutes = 24 * 60; // 11:59 PM

		

		let currentStart = startMinutes;
		while (currentStart + slotSize.size <= endMinutes) {
			const currentEnd = currentStart + slotSize.size;
			allSlots.push({
				startTime: this.minutesToTime(currentStart),
				endTime: this.minutesToTime(currentEnd),
			});
			currentStart = currentEnd;
		}

		// Check for conflicts with existing slots
		const conflicts: Array<SlotStartEnd> = [];
		const availableSlots: Array<SlotStartEnd> = [];

		for (const slot of allSlots) {
			let hasConflict = false;
			for (const existingSlot of existingSlots) {
				const slotStart = this.timeToMinutes(slot.startTime);
				const slotEnd = this.timeToMinutes(slot.endTime);
				const existingStart = this.timeToMinutes(existingSlot.startTime);
				const existingEnd = this.timeToMinutes(existingSlot.endTime);

				// Check if time ranges overlap
				if (
					(slotStart < existingEnd && slotEnd > existingStart) ||
					(existingStart < slotEnd && existingEnd > slotStart)
				) {
					hasConflict = true;
					break;
				}
			}

			if (hasConflict) {
				conflicts.push(slot);
			} else {
				availableSlots.push(slot);
			}
		}

		return {
			availableSlots,
			existingSlots,
			conflicts,
		};
	}

	// Bulk delete slots (only unbooked ones)
	async bulkDeleteSlots(
		slotIds: string[],
		physicianId: string,
	): Promise<{
		deleted: string[];
		failed: Array<{ slotId: string; reason: string }>;
	}> {
		const deleted: string[] = [];
		const failed: Array<{ slotId: string; reason: string }> = [];

		const promises = slotIds.map(async (slotId) => {
			try {
				const slot = await this.getSlotById(slotId);
				if (!slot) {
					failed.push({ slotId, reason: "Slot not found" });
					return;
				}

				const availability = await this.getAvailabilityDateById(
					slot.availabilityId,
				);
				if (!availability || availability.physicianId !== physicianId) {
					failed.push({ slotId, reason: "Unauthorized" });
					return;
				}

				const isBooked = await this.isSlotBooked(slotId);
				if (isBooked) {
					failed.push({ slotId, reason: "Slot is booked" });
					return;
				}

				await this.deleteSlot(slotId);
				deleted.push(slotId);
			} catch (error: any) {
				failed.push({ slotId, reason: error.message || "Unknown error" });
			}
		});

		await Promise.all(promises);
		return { deleted, failed };
	}

	// Get appointments for physicians/admins
	async getAppointments(
		physicianId: string | null,
		hasReadAllAppointments: boolean,
		options: {
			page?: number;
			limit?: number;
			skip?: number;
			search?: string;
			startDate?: string;
			endDate?: string;
		} = {},
	): Promise<{
		appointments: Array<{
			id: string;
			time: string;
			date: string;
			patientName: string;
			type: string;
			doctorName: string;
			status: string;
		}>;
		total: number;
		page: number;
		limit: number;
	}> {
		const patientsAlias = alias(users, "patients");
		const physiciansAlias = alias(users, "physicians");

		const { page = 1, limit = 10, search, startDate, endDate, skip } = options;
		const offset = skip ? skip : (page - 1) * limit;

		const statusCondition = or(
			eq(bookedSlots.status, BOOKING_STATUS_ENUM.PENDING),
			eq(bookedSlots.status, BOOKING_STATUS_ENUM.CONFIRMED),
		);
		const conditions: SQL<unknown>[] = [];

		if (statusCondition) {
			conditions.push(statusCondition);
		}
		// Filter by physician if provided (for read_own_appointments)
		if (physicianId) {
			conditions.push(eq(availabilityDate.physicianId, physicianId));
		}

		// Filter by date range or today
		if (startDate) {
			conditions.push(
				sql`DATE(${availabilityDate.date}) >= DATE(${startDate})`,
			);
		}
		if (endDate) {
			conditions.push(sql`DATE(${availabilityDate.date}) <= DATE(${endDate})`);
		}

		if (search) {
			conditions.push(
				ilike(patientsAlias.firstName, `%${search}%`),
				ilike(patientsAlias.lastName, `%${search}%`),
			);
			if (hasReadAllAppointments) {
				conditions.push(
					ilike(physiciansAlias.firstName, `%${search}%`),
					ilike(physiciansAlias.lastName, `%${search}%`),
				);
			}
		}

		const totalCountPromise = db
			.select({ count: count() })
			.from(bookedSlots)
			.innerJoin(slots, eq(bookedSlots.slotId, slots.id))
			.innerJoin(
				availabilityDate,
				eq(slots.availabilityId, availabilityDate.id),
			)
			.innerJoin(patientsAlias, eq(bookedSlots.customerId, patientsAlias.id))
			.innerJoin(
				physiciansAlias,
				eq(availabilityDate.physicianId, physiciansAlias.id),
			)
			.innerJoin(slotType, eq(bookedSlots.slotTypeId, slotType.id))
			.where(and(...conditions));

		const allBookingsPromise = db
			.select({
				id: bookedSlots.id,
				status: bookedSlots.status,
				patientName: sql<string>`CONCAT(${patientsAlias.firstName}, ' ', ${patientsAlias.lastName})`,
				doctorName: sql<string>`CONCAT(${physiciansAlias.firstName}, ' ', ${physiciansAlias.lastName})`,
				time: sql<string>`TO_CHAR(TO_TIMESTAMP(${slots.startTime}, 'HH24:MI:SS'), 'HH12:MI AM')`,
				date: sql<string>`DATE(${availabilityDate.date})`,
				type: sql<string>`CASE WHEN ${slotType.type} = ${SLOT_TYPE.ONLINE} THEN 'Video Call' WHEN ${slotType.type} = ${SLOT_TYPE.ONSITE} THEN 'In Person' END`,
			})
			.from(bookedSlots)
			.innerJoin(slots, eq(bookedSlots.slotId, slots.id))
			.innerJoin(
				availabilityDate,
				eq(slots.availabilityId, availabilityDate.id),
			)
			.innerJoin(patientsAlias, eq(bookedSlots.customerId, patientsAlias.id))
			.innerJoin(
				physiciansAlias,
				eq(availabilityDate.physicianId, physiciansAlias.id),
			)
			.innerJoin(slotType, eq(bookedSlots.slotTypeId, slotType.id))
			.where(and(...conditions))
			.limit(limit)
			.offset(offset);

		const [totalCount, allBookings] = await Promise.all([
			totalCountPromise,
			allBookingsPromise,
		]);

		return {
			appointments: allBookings,
			total: totalCount[0].count,
			page: page,
			limit: limit,
		};
	}

	async getAvailabilitiesForDate(date: string) {
		return await db
			.select({
				id: availabilityDate.id,
				date: sql<string>`DATE(${availabilityDate.date})`,
				physicianId: availabilityDate.physicianId,
			})
			.from(availabilityDate)
			.where(sql`DATE(${availabilityDate.date}) = DATE(${date})`);
	}
}
