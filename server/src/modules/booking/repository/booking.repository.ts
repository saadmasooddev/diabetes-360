import { db } from "../../../app/config/db";
import { eq, and, gte, sql, inArray, or } from "drizzle-orm";
import {
  slotSize,
  availabilityDate,
  slots,
  slotType,
  slotTypeJunction,
  slotPrice,
  bookedSlots,
  slotLocations,
} from "../models/booking.schema";
import { physicianLocations } from "../../auth/models/user.schema";
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

export class BookingRepository {
  // Slot Size operations
  async getAllSlotSizes(): Promise<SlotSize[]> {
    return await db.select().from(slotSize).orderBy(slotSize.size);
  }

  async getSlotSizeById(id: string): Promise<SlotSize | null> {
    const [size] = await db.select().from(slotSize).where(eq(slotSize.id, id)).limit(1);
    return size || null;
  }

  async getSlotSizeBySize(size: number): Promise<SlotSize | null> {
    const [sizeRecord] = await db.select().from(slotSize).where(eq(slotSize.size, size)).limit(1);
    return sizeRecord || null;
  }

  // Slot Type operations
  async getAllSlotTypes(): Promise<SlotType[]> {
    return await db.select().from(slotType).orderBy(slotType.type);
  }

  async getSlotTypeById(id: string): Promise<SlotType | null> {
    const [type] = await db.select().from(slotType).where(eq(slotType.id, id)).limit(1);
    return type || null;
  }

  async getSlotTypeByType(type: string): Promise<SlotType | null> {
    const [typeRecord] = await db.select().from(slotType).where(eq(slotType.type, type)).limit(1);
    return typeRecord || null;
  }

  // Availability Date operations
  async createAvailabilityDate(data: InsertAvailabilityDate): Promise<AvailabilityDate> {
    const [availability] = await db
      .insert(availabilityDate)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    return availability;
  }

  async getAvailabilityDateByPhysicianAndDate(
    physicianId: string,
    date: Date
  ): Promise<AvailabilityDate | null> {
    const dateStr = date.toISOString().split("T")[0];
    const [availability] = await db
      .select()
      .from(availabilityDate)
      .where(
        and(
          eq(availabilityDate.physicianId, physicianId),
          sql`DATE(${availabilityDate.date}) = DATE(${sql.raw(`'${dateStr}'`)})`
        )
      )
      .limit(1);
    return availability || null;
  }

  async getAvailabilityDatesByPhysician(physicianId: string): Promise<AvailabilityDate[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await db
      .select()
      .from(availabilityDate)
      .where(
        and(
          eq(availabilityDate.physicianId, physicianId),
          gte(availabilityDate.date, today)
        )
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
    const [slot] = await db.select().from(slots).where(eq(slots.id, id)).limit(1);
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

  async getSlotWithDetails(id: string): Promise<
    | (Slot & {
        slotSize: SlotSize;
        availability: AvailabilityDate;
        prices: SlotPrice[];
        types: SlotType[];
        locations: Array<typeof physicianLocations.$inferSelect>;
        isBooked: boolean;
      })
    | null
  > {
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

    const [availability] = await db
      .select()
      .from(availabilityDate)
      .where(eq(availabilityDate.id, slot.availabilityId))
      .limit(1);

    const prices = await db
      .select()
      .from(slotPrice)
      .where(eq(slotPrice.slotId, slot.id));

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
            eq(bookedSlots.status, "confirmed")
          )
        )
      )
      .limit(1);

    // Get slot locations
    const slotLocationRecords = await this.getSlotLocationsBySlotId(slot.id);
    const locations = slotLocationRecords.map((sl) => sl.location);

    return {
      ...slot,
      slotSize: slotSizeRecord!,
      availability: availability!,
      prices: prices.map((p) => ({ ...p, slotType: types.find((t) => t.id === p.slotTypeId)! })),
      types,
      locations,
      isBooked: !!booked,
    };
  }

  // Slot Type Junction operations
  async createSlotTypeJunction(data: InsertSlotTypeJunction): Promise<SlotTypeJunction> {
    const [junction] = await db.insert(slotTypeJunction).values(data).returning();
    return junction;
  }

  async createMultipleSlotTypeJunctions(
    junctions: InsertSlotTypeJunction[]
  ): Promise<SlotTypeJunction[]> {
    if (junctions.length === 0) return [];
    return await db.insert(slotTypeJunction).values(junctions).returning();
  }

  async getSlotTypeJunctionsBySlotId(slotId: string): Promise<SlotTypeJunction[]> {
    return await db
      .select()
      .from(slotTypeJunction)
      .where(eq(slotTypeJunction.slotId, slotId));
  }

  async deleteSlotTypeJunctionsBySlotId(slotId: string): Promise<void> {
    await db.delete(slotTypeJunction).where(eq(slotTypeJunction.slotId, slotId));
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

  async createMultipleSlotPrices(prices: InsertSlotPrice[]): Promise<SlotPrice[]> {
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
    const [price] = await db.select().from(slotPrice).where(eq(slotPrice.id, id)).limit(1);
    return price || null;
  }

  async getSlotPricesBySlotId(slotId: string): Promise<SlotPrice[]> {
    return await db.select().from(slotPrice).where(eq(slotPrice.slotId, slotId));
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
    const [booked] = await db.select().from(bookedSlots).where(eq(bookedSlots.id, id)).limit(1);
    return booked || null;
  }

  async isSlotBooked(slotId: string): Promise<boolean> {
    const [booked] = await db
      .select()
      .from(bookedSlots)
      .where(
        and(
          eq(bookedSlots.slotId, slotId),
          or(eq(bookedSlots.status, "pending"), eq(bookedSlots.status, "confirmed"))
        )
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
    date: Date
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
    const dateStr = date.toISOString().split("T")[0];
    const availability = await this.getAvailabilityDateByPhysicianAndDate(physicianId, date);

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
          or(eq(bookedSlots.status, "pending"), eq(bookedSlots.status, "confirmed"))
        )
      );

    const bookedIds = new Set(bookedSlotIds.map((b) => b.slotId));

    const slotSizes = await db
      .select()
      .from(slotSize)
      .where(inArray(slotSize.id, slotsList.map((s) => s.slotSizeId)));

    const sizeMap = new Map(slotSizes.map((s) => [s.id, s]));

    const prices = await db
      .select()
      .from(slotPrice)
      .where(inArray(slotPrice.slotId, slotIds));

    const typeJunctions = await db
      .select()
      .from(slotTypeJunction)
      .where(inArray(slotTypeJunction.slotId, slotIds));

    const typeIds = [...Array.from(new Set(typeJunctions.map((j) => j.slotTypeId)))];
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
      priceMap.get(p.slotId)!.push({ ...p, slotType: typeMap.get(p.slotTypeId)! });
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
        eq(slotLocations.locationId, physicianLocations.id)
      )
      .where(inArray(slotLocations.slotId, slotIds));

    const locationMap = new Map<string, Array<typeof physicianLocations.$inferSelect>>();
    slotLocationRecords.forEach((sl) => {
      if (!locationMap.has(sl.slotId)) {
        locationMap.set(sl.slotId, []);
      }
      locationMap.get(sl.slotId)!.push(sl.location);
    });

    return slotsList.map((slot) => ({
      ...slot,
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
          gte(availabilityDate.date, today)
        )
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
    excludeSlotId?: string
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
      typeIds: typeJunctions.filter((j) => j.slotId === slot.id).map((j) => j.slotTypeId),
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

      if (timeOverlaps) {
        // Check if slot types overlap
        const hasCommonType = slot.typeIds.some((tid) => slotTypeIds.includes(tid));
        if (hasCommonType) {
          return true; // Overlapping found
        }
      }
    }

    return false;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
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
    locations: InsertSlotLocation[]
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
        eq(slotLocations.locationId, physicianLocations.id)
      )
      .where(eq(slotLocations.slotId, slotId));
  }

  async deleteSlotLocationsBySlotId(slotId: string): Promise<void> {
    await db.delete(slotLocations).where(eq(slotLocations.slotId, slotId));
  }

  async updateSlotLocations(
    slotId: string,
    locationIds: string[]
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
}

