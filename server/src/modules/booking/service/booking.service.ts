import { BookingRepository } from "../repository/booking.repository";
import { BadRequestError, ConflictError, NotFoundError, ForbiddenError } from "../../../shared/errors";
import type {
  InsertSlot,
  InsertSlotPrice,
  InsertSlotTypeJunction,
  UpdateSlotPrice,
} from "../../auth/models/user.schema";

export class BookingService {
  private bookingRepository: BookingRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  async getAllSlotSizes() {
    return await this.bookingRepository.getAllSlotSizes();
  }

  async getAllSlotTypes() {
    return await this.bookingRepository.getAllSlotTypes();
  }

  async createAvailabilityDate(physicianId: string, date: Date) {
    // Check if date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly < today) {
      throw new BadRequestError("Cannot create availability for past dates");
    }

    // Check if availability already exists
    const existing = await this.bookingRepository.getAvailabilityDateByPhysicianAndDate(
      physicianId,
      date
    );
    if (existing) {
      throw new ConflictError("Availability already exists for this date");
    }

    return await this.bookingRepository.createAvailabilityDate({
      physicianId,
      date,
    });
  }

  async getAvailabilityDates(physicianId: string) {
    return await this.bookingRepository.getAvailabilityDatesByPhysician(physicianId);
  }

  async getDatesWithAvailability(physicianId: string) {
    return await this.bookingRepository.getDatesWithAvailability(physicianId);
  }

  async getSlotsForDate(physicianId: string, date: Date) {
    return await this.getSlotDetailsForDate(physicianId, date);
  }

  async getAvailableSlotsForDate(physicianId: string, date: Date) {
    return await this.bookingRepository.getAvailableSlotsForDate(physicianId, date);
  }

  async createSlots(
    physicianId: string,
    date: Date,
    slotSizeId: string,
    startTime: string,
    endTime: string,
    slotTypeIds: string[],
    prices: { slotTypeId: string; price: string }[],
    locationIds?: string[]
  ) {
    // Validate date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly < today) {
      throw new BadRequestError("Cannot create slots for past dates");
    }

    // Get or create availability date
    let availability = await this.bookingRepository.getAvailabilityDateByPhysicianAndDate(
      physicianId,
      date
    );
 
    if (!availability) {
      availability = await this.bookingRepository.createAvailabilityDate({
        physicianId,
        date,
      });
    }

    // Get slot size to validate
    const slotSize = await this.bookingRepository.getSlotSizeById(slotSizeId);
    if (!slotSize) {
      throw new NotFoundError("Slot size not found");
    }

    // Validate slot types exist
    for (const typeId of slotTypeIds) {
      const type = await this.bookingRepository.getSlotTypeById(typeId);
      if (!type) {
        throw new NotFoundError(`Slot type ${typeId} not found`);
      }
    }

    // Validate time format and calculate slots
    const slots = this.generateSlots(startTime, endTime, slotSize.size);
    if (slots.length === 0) {
      throw new BadRequestError("Invalid time range or slot size");
    }

    // Check for overlapping slots
    const hasOverlap = await this.bookingRepository.checkOverlappingSlots(
      availability.id,
      startTime,
      endTime,
      slotTypeIds
    );

    if (hasOverlap) {
      throw new ConflictError(
        "Slots overlap with existing slots of the same type for this date"
      );
    }

    // Create slots
    const slotData: InsertSlot[] = slots.map((slot) => ({
      availabilityId: availability!.id,
      startTime: slot.start,
      endTime: slot.end,
      slotSizeId,
    }));

    const createdSlots = await this.bookingRepository.createMultipleSlots(slotData);

    // Create slot type junctions
    const junctionData: InsertSlotTypeJunction[] = [];
    createdSlots.forEach((slot) => {
      slotTypeIds.forEach((typeId) => {
        junctionData.push({
          slotId: slot.id,
          slotTypeId: typeId,
        });
      });
    });

    await this.bookingRepository.createMultipleSlotTypeJunctions(junctionData);

    // Create slot prices
    const priceData: InsertSlotPrice[] = [];
    createdSlots.forEach((slot) => {
      prices.forEach((price) => {
        if (slotTypeIds.includes(price.slotTypeId)) {
          priceData.push({
            slotId: slot.id,
            slotTypeId: price.slotTypeId,
            price: price.price,
          });
        }
      });
    });

    await this.bookingRepository.createMultipleSlotPrices(priceData);

    // Create slot locations if provided (for offline consultations)
    if (locationIds && locationIds.length > 0) {
      // Check if slot types include offline/onsite
      const slotTypes = await Promise.all(
        slotTypeIds.map((id) => this.bookingRepository.getSlotTypeById(id))
      );

      const hasOfflineType = slotTypes.some(
        (type) => type && (type.type.toLowerCase() === "onsite" || type.type.toLowerCase() === "offline")
      );

      if (hasOfflineType) {
        const locationData: Array<{ slotId: string; locationId: string }> = [];
        createdSlots.forEach((slot) => {
          locationIds.forEach((locationId) => {
            locationData.push({
              slotId: slot.id,
              locationId,
            });
          });
        });
        await this.bookingRepository.createMultipleSlotLocations(locationData);
      }
    }

    return createdSlots;
  }

  async deleteSlot(slotId: string, physicianId: string) {
    const slot = await this.bookingRepository.getSlotById(slotId);
    if (!slot) {
      throw new NotFoundError("Slot not found");
    }

    const availability = await this.bookingRepository.getAvailabilityDateById(
      slot.availabilityId
    );
    if (!availability || availability.physicianId !== physicianId) {
      throw new ForbiddenError("You can only delete your own slots");
    }

    // Check if slot is booked
    const isBooked = await this.bookingRepository.isSlotBooked(slotId);
    if (isBooked) {
      throw new BadRequestError("Cannot delete a booked slot");
    }

    await this.bookingRepository.deleteSlot(slotId);
  }

  async updateSlotPrice(
    priceId: string,
    price: string,
    physicianId?: string,
    isAdmin: boolean = false
  ) {
    const slotPrice = await this.bookingRepository.getSlotPriceById(priceId);
    if (!slotPrice) {
      throw new NotFoundError("Slot price not found");
    }

    const slot = await this.bookingRepository.getSlotById(slotPrice.slotId);
    if (!slot) {
      throw new NotFoundError("Slot not found");
    }

    const availability = await this.bookingRepository.getAvailabilityDateById(
      slot.availabilityId
    );
    if (!availability) {
      throw new NotFoundError("Availability not found");
    }

    // Check permissions
    if (!isAdmin && availability.physicianId !== physicianId) {
      throw new ForbiddenError("You can only update prices for your own slots");
    }

    // Check if slot is booked
    const isBooked = await this.bookingRepository.isSlotBooked(slot.id);
    if (isBooked) {
      throw new BadRequestError("Cannot update price for a booked slot");
    }

    return await this.bookingRepository.updateSlotPrice(priceId, { price });
  }

  async getSlotWithDetails(slotId: string) {
    return await this.bookingRepository.getSlotWithDetails(slotId);
  }

  async getSlotDetailsForDate(physicianId: string, date: Date) {
    const availability = await this.bookingRepository.getAvailabilityDateByPhysicianAndDate(
      physicianId,
      date
    );

    if (!availability) {
      return [];
    }

    const slotsList = await this.bookingRepository.getSlotsByAvailabilityId(availability.id);
    const details = await Promise.all(
      slotsList.map((slot) => this.bookingRepository.getSlotWithDetails(slot.id))
    );

    return details.filter((d) => d !== null) as Array<NonNullable<typeof details[0]>>;
  }

  async updateSlotLocations(
    slotId: string,
    locationIds: string[],
    physicianId?: string,
    isAdmin: boolean = false
  ) {
    const slot = await this.bookingRepository.getSlotById(slotId);
    if (!slot) {
      throw new NotFoundError("Slot not found");
    }

    const availability = await this.bookingRepository.getAvailabilityDateById(
      slot.availabilityId
    );
    if (!availability) {
      throw new NotFoundError("Availability not found");
    }

    // Check permissions
    if (!isAdmin && availability.physicianId !== physicianId) {
      throw new ForbiddenError("You can only update locations for your own slots");
    }

    // Check if slot is booked
    const isBooked = await this.bookingRepository.isSlotBooked(slot.id);
    if (isBooked) {
      throw new BadRequestError("Cannot update locations for a booked slot");
    }

    return await this.bookingRepository.updateSlotLocations(slotId, locationIds);
  }

  async bookSlot(customerId: string, slotId: string) {
    const slot = await this.bookingRepository.getSlotById(slotId);
    if (!slot) {
      throw new NotFoundError("Slot not found");
    }

    // Check if slot is already booked
    const isBooked = await this.bookingRepository.isSlotBooked(slotId);
    if (isBooked) {
      throw new ConflictError("Slot is already booked");
    }

    return await this.bookingRepository.createBookedSlot({
      customerId,
      slotId,
      status: "pending",
    });
  }

  private generateSlots(
    startTime: string,
    endTime: string,
    slotSizeMinutes: number
  ): Array<{ start: string; end: string }> {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      return [];
    }

    const slots: Array<{ start: string; end: string }> = [];
    let currentStart = startMinutes;

    while (currentStart + slotSizeMinutes <= endMinutes) {
      const currentEnd = currentStart + slotSizeMinutes;
      slots.push({
        start: this.minutesToTime(currentStart),
        end: this.minutesToTime(currentEnd),
      });
      currentStart = currentEnd;
    }

    return slots;
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
}

