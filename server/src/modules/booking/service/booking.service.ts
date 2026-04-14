import {
	type BookingPriceCalculation,
	BookingRepository,
	type SlotWithDetails,
} from "../repository/booking.repository";
import { SettingsService } from "../../settings/service/settings.service";
import { UserRepository } from "../../user/repository/user.repository";
import {
	BadRequestError,
	ConflictError,
	NotFoundError,
	ForbiddenError,
} from "../../../shared/errors";
import { db } from "../../../app/config/db";
import {
	PAYMENT_TYPE,
	USER_ROLES,
	type UserRole,
	physicianData,
	userRole,
} from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";
import {
	BOOKING_TYPE_ENUM,
	BOOKING_STATUS_ENUM,
	type BOOKING_TYPE_QUERY_ENUM,
	type InsertSlot,
	type InsertSlotTypeJunction,
	type SUMMARY_STATUS_ENUM,
	BOOKED_SLOTS_STATUS,
} from "../models/booking.schema";
import { ConsultationService } from "./consultation.service";
import { DateManager } from "server/src/shared/utils/utils";
import type { MedicineDosage } from "../../medical/repository/medical.repository";
import { PushNotificationService } from "../../notifications/services/push-notification.service";
import { PUSH_MESSAGE_TYPE_ENUM } from "../../notifications/models/fcm.schema";
import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import { zoomService } from "server/src/shared/services/zoom.service";
import { emailService } from "server/src/shared/services/email.service";

export class BookingService {
	private bookingRepository: BookingRepository;
	private consultationService: ConsultationService;
	private settingsService: SettingsService;
	private userRepository: UserRepository;
	private pushNotificationService: PushNotificationService;

	constructor() {
		this.bookingRepository = new BookingRepository();
		this.settingsService = new SettingsService();
		this.userRepository = new UserRepository();
		this.consultationService = new ConsultationService();
		this.pushNotificationService = new PushNotificationService();
	}

	async getAllSlotSizes() {
		return await this.bookingRepository.getAllSlotSizes();
	}

	async getAllSlotTypes() {
		return await this.bookingRepository.getAllSlotTypes();
	}

	async createAvailabilityDate(physicianId: string, date: string) {
		// Check if date is in the future
		const today = new Date().toISOString();
		const dateOnly = new Date(date).toISOString();

		if (dateOnly < today) {
			throw new BadRequestError("Cannot create availability for past dates");
		}

		// Check if availability already exists
		const existing =
			await this.bookingRepository.getAvailabilityDateByPhysicianAndDate(
				physicianId,
				date,
			);
		if (existing) {
			throw new ConflictError("Availability already exists for this date");
		}

		return await this.bookingRepository.createAvailabilityDate({
			physicianId,
			date: date,
		});
	}

	async getAvailabilityDates(physicianId: string) {
		return await this.bookingRepository.getAvailabilityDatesByPhysician(
			physicianId,
		);
	}

	async getDatesWithAvailability(physicianId: string) {
		return await this.bookingRepository.getDatesWithAvailability(physicianId);
	}

	async getSlotsForDate(physicianId: string, date: string) {
		return await this.getSlotDetailsForDate(physicianId, date);
	}

	async getAvailableSlotsForDate(physicianId: string, date: string) {
		return await this.bookingRepository.getAvailableSlotsForDate(
			physicianId,
			date,
		);
	}

	async createSlots(
		physicianId: string,
		timestamp: number,
		timeZone: string,
		slotSizeId: string,
		slotTimes: { startTime: string; endTime: string }[],
		slotTypeIds: string[],
		locationIds?: string[],
	) {
		const { availableSlots } = await this.generateSlotsForDay(
			physicianId,
			timestamp,
			timeZone,
			slotSizeId,
		);

		const useableSlots = slotTimes.filter((st) =>
			availableSlots.some(
				(as) => as.startTime === st.startTime && as.endTime === st.endTime,
			),
		);
		const ignoredCount = slotTimes.length - useableSlots.length;

		if (useableSlots.length === 0) {
			const message =
				ignoredCount > 0
					? `No available slots for this date. ${ignoredCount} slot(s) were in the past and ignored.`
					: "No available slots for this date. All time slots conflict with existing slots.";
			throw new BadRequestError(message);
		}

		const date = DateManager.getLocalTime(timestamp, timeZone).toISOString()
		let availability =
			await this.bookingRepository.getAvailabilityDateByPhysicianAndDate(
				physicianId,
				date,
			);

		if (!availability) {
			availability = await this.bookingRepository.createAvailabilityDate({
				physicianId,
				date: date,
			});
		}

		if (!availability) {
			throw new ConflictError("Availability not found");
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
		const slotResults = await Promise.all(
			useableSlots.map(async ({ startTime, endTime }) => {
				const slots = this.generateSlots(startTime, endTime, slotSize.size);
				if (slots.length === 0) {
					throw new BadRequestError("Invalid time range or slot size");
				}

				// Check for overlapping slots
				const hasOverlap = await this.bookingRepository.checkOverlappingSlots(
					availability!.id,
					startTime,
					endTime,
					slotTypeIds,
				);

				if (hasOverlap) {
					throw new ConflictError(
						"Slots overlap with existing slots for this date. Please delete existing slots in this time range before creating new ones.",
					);
				}
				return slots;
			}),
		);

		const slots = slotResults.flat();

		// Create slots
		const slotData: InsertSlot[] = slots.map((slot) => ({
			availabilityId: availability!.id,
			startTime: slot.start,
			endTime: slot.end,
			slotSizeId,
		}));

		const createdSlots =
			await this.bookingRepository.createMultipleSlots(slotData);

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

		// Create slot locations if provided (for offline consultations)
		if (locationIds && locationIds.length > 0) {
			// Check if slot types include offline/onsite
			const slotTypes = await Promise.all(
				slotTypeIds.map((id) => this.bookingRepository.getSlotTypeById(id)),
			);

			const hasOfflineType = slotTypes.some(
				(type) =>
					type &&
					(type.type.toLowerCase() === "onsite" ||
						type.type.toLowerCase() === "offline"),
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

		return {
			slots: createdSlots,
			ignoredCount,
		};
	}

	/**
	 * Create a custom-sized slot with exact start and end times
	 * Uses the smallest available slot size as a reference and stores actual duration
	 */
	async createCustomSlot(
		physicianId: string,
		date: string,
		startTime: string,
		endTime: string,
		slotTypeIds: string[],
		locationIds?: string[],
	) {
		// Validate date is not in the past
		if (DateManager.isBeforeToday(date)) {
			throw new BadRequestError("Cannot create slots for past dates");
		}

		// Validate time format and calculate duration
		const startMinutes = this.timeToMinutes(startTime);
		const endMinutes = this.timeToMinutes(endTime);

		if (startMinutes >= endMinutes) {
			throw new BadRequestError("End time must be after start time");
		}

		const durationMinutes = endMinutes - startMinutes;
		if (durationMinutes <= 0) {
			throw new BadRequestError("End time must be after start time");
		}

		if (durationMinutes > 480) {
			throw new BadRequestError("Slot duration cannot exceed 8 hours");
		}

		// Get or create availability date
		let availability =
			await this.bookingRepository.getAvailabilityDateByPhysicianAndDate(
				physicianId,
				date,
			);

		if (!availability) {
			availability = await this.bookingRepository.createAvailabilityDate({
				physicianId,
				date: date,
			});
		}

		const allSlotSizes = await this.bookingRepository.getAllSlotSizes();
		if (allSlotSizes.length === 0) {
			throw new NotFoundError("No slot sizes found in the system");
		}

		const smallestSlotSize = allSlotSizes.reduce((min, size) =>
			size.size < min.size ? size : min,
		);

		// Validate slot types exist
		for (const typeId of slotTypeIds) {
			const type = await this.bookingRepository.getSlotTypeById(typeId);
			if (!type) {
				throw new NotFoundError(`Slot type ${typeId} not found`);
			}
		}

		// Check for overlapping slots
		const hasOverlap = await this.bookingRepository.checkOverlappingSlots(
			availability.id,
			startTime,
			endTime,
			slotTypeIds,
		);

		if (hasOverlap) {
			throw new ConflictError(
				"Slot overlaps with existing slots for this date. Please delete existing slots in this time range before creating new ones.",
			);
		}

		const slotData: InsertSlot = {
			availabilityId: availability.id,
			startTime: startTime,
			endTime: endTime,
			slotSizeId: smallestSlotSize.id, // Use smallest size as reference
			isCustom: true,
		};

		const createdSlot = await this.bookingRepository.createSlot(slotData);

		// Create slot type junctions
		const junctionData: InsertSlotTypeJunction[] = [];
		slotTypeIds.forEach((typeId) => {
			junctionData.push({
				slotId: createdSlot.id,
				slotTypeId: typeId,
			});
		});

		await this.bookingRepository.createMultipleSlotTypeJunctions(junctionData);

		// Create slot locations if provided (for offline consultations)
		if (locationIds && locationIds.length > 0) {
			// Check if slot types include offline/onsite
			const slotTypes = await Promise.all(
				slotTypeIds.map((id) => this.bookingRepository.getSlotTypeById(id)),
			);

			const hasOfflineType = slotTypes.some(
				(type) =>
					type &&
					(type.type.toLowerCase() === "onsite" ||
						type.type.toLowerCase() === "offline"),
			);

			if (hasOfflineType) {
				const locationData: Array<{ slotId: string; locationId: string }> = [];
				locationIds.forEach((locationId) => {
					locationData.push({
						slotId: createdSlot.id,
						locationId,
					});
				});
				await this.bookingRepository.createMultipleSlotLocations(locationData);
			}
		}

		return createdSlot;
	}

	async deleteSlot(slotId: string, physicianId: string) {
		const slot = await this.bookingRepository.getSlotById(slotId);
		if (!slot) {
			throw new NotFoundError("Slot not found");
		}

		const availability = await this.bookingRepository.getAvailabilityDateById(
			slot.availabilityId,
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
		isAdmin: boolean = false,
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
			slot.availabilityId,
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

	async getSlotDetailsForDate(physicianId: string, date: string) {
		const availability =
			await this.bookingRepository.getAvailabilityDateByPhysicianAndDate(
				physicianId,
				date,
			);

		if (!availability) {
			return [];
		}

		const slotsList = await this.bookingRepository.getSlotsByAvailabilityId(
			availability.id,
		);
		const details = await Promise.all(
			slotsList.map((slot) =>
				this.bookingRepository.getSlotWithDetails(slot.id),
			),
		);

		return details
			.filter((d) => d !== null)
			.map((d) => ({ ...d, availabilityDate: availability.date })) as Array<
			NonNullable<(typeof details)[0]>
		>;
	}

	async updateSlotLocations(
		slotId: string,
		locationIds: string[],
		physicianId?: string,
		isAdmin: boolean = false,
	) {
		const slot = await this.bookingRepository.getSlotById(slotId);
		if (!slot) {
			throw new NotFoundError("Slot not found");
		}

		const availability = await this.bookingRepository.getAvailabilityDateById(
			slot.availabilityId,
		);
		if (!availability) {
			throw new NotFoundError("Availability not found");
		}

		// Check permissions
		if (!isAdmin && availability.physicianId !== physicianId) {
			throw new ForbiddenError(
				"You can only update locations for your own slots",
			);
		}

		// Check if slot is booked
		const isBooked = await this.bookingRepository.isSlotBooked(slot.id);
		if (isBooked) {
			throw new BadRequestError("Cannot update locations for a booked slot");
		}

		return await this.bookingRepository.updateSlotLocations(
			slotId,
			locationIds,
		);
	}

	async updateSlot(
		slotId: string,
		data: {
			startTime?: string;
			endTime?: string;
			slotTypeIds?: string[];
			locationIds?: string[];
		},
		physicianId?: string,
		isAdmin: boolean = false,
	) {
		const slot = await this.bookingRepository.getSlotById(slotId);
		if (!slot) {
			throw new NotFoundError("Slot not found");
		}

		const availability = await this.bookingRepository.getAvailabilityDateById(
			slot.availabilityId,
		);
		if (!availability) {
			throw new NotFoundError("Availability not found");
		}

		// Check permissions
		if (!isAdmin && availability.physicianId !== physicianId) {
			throw new ForbiddenError("You can only update your own slots");
		}

		// Check if slot is booked
		const isBooked = await this.bookingRepository.isSlotBooked(slot.id);
		if (isBooked) {
			throw new BadRequestError("Cannot update a booked slot");
		}

		// Validate slot types if provided
		if (data.slotTypeIds !== undefined) {
			if (!Array.isArray(data.slotTypeIds) || data.slotTypeIds.length === 0) {
				throw new BadRequestError("At least one slot type is required");
			}

			// Validate slot types exist
			const slotTypes = await this.bookingRepository.getSlotTypesByIds(
				data.slotTypeIds,
			);
			if (slotTypes.length !== data.slotTypeIds.length) {
				throw new NotFoundError(`Slot types proivded are incorrect`);
			}
		}

		// Update times only if slot is custom
		if (data.startTime !== undefined || data.endTime !== undefined) {
			if (!slot.isCustom) {
				throw new BadRequestError(
					"Cannot update start/end times for non-custom slots",
				);
			}

			const startTime = data.startTime ?? slot.startTime;
			const endTime = data.endTime ?? slot.endTime;

			// Validate time format and calculate duration
			const startMinutes = this.timeToMinutes(startTime);
			const endMinutes = this.timeToMinutes(endTime);

			if (startMinutes >= endMinutes) {
				throw new BadRequestError("End time must be after start time");
			}

			const durationMinutes = endMinutes - startMinutes;
			if (durationMinutes <= 0) {
				throw new BadRequestError("End time must be after start time");
			}

			if (durationMinutes > 480) {
				throw new BadRequestError("Slot duration cannot exceed 8 hours");
			}

			// Get current slot types for overlap check
			const currentTypeJunctions =
				await this.bookingRepository.getSlotTypeJunctionsBySlotId(slotId);
			const currentTypeIds = currentTypeJunctions.map((j) => j.slotTypeId);
			const typeIdsForOverlapCheck = data.slotTypeIds || currentTypeIds;

			// Check for overlapping slots (excluding current slot)
			const hasOverlap = await this.bookingRepository.checkOverlappingSlots(
				availability.id,
				startTime,
				endTime,
				typeIdsForOverlapCheck,
				slotId,
			);

			if (hasOverlap) {
				throw new ConflictError(
					"Slot overlaps with existing slots for this date. Please delete existing slots in this time range before updating.",
				);
			}

			// Update slot times
			await this.bookingRepository.updateSlot(slotId, {
				startTime,
				endTime,
			});
		}

		// Update slot types if provided
		if (data.slotTypeIds !== undefined) {
			await this.bookingRepository.updateSlotTypes(slotId, data.slotTypeIds);
		}

		// Update locations if provided
		if (data.locationIds !== undefined) {
			// Get current slot types (use updated types if provided, otherwise get from slot)
			const typeIdsToCheck =
				data.slotTypeIds ||
				(await this.bookingRepository.getSlotTypeJunctionsBySlotId(slotId)).map(
					(j) => j.slotTypeId,
				);

			const currentSlotTypes = await Promise.all(
				typeIdsToCheck.map((id) => this.bookingRepository.getSlotTypeById(id)),
			);

			const hasOfflineType = currentSlotTypes.some(
				(type) =>
					type &&
					(type.type.toLowerCase() === "onsite" ||
						type.type.toLowerCase() === "offline"),
			);

			if (hasOfflineType && data.locationIds.length === 0) {
				throw new BadRequestError(
					"Location is required for onsite/offline consultations",
				);
			}

			await this.bookingRepository.updateSlotLocations(
				slotId,
				data.locationIds || [],
			);
		}

		// Return updated slot with details
		return await this.bookingRepository.getSlotWithDetails(slotId);
	}

	async bookSlot(
		physicianId: string,
		customerId: string,
		slotId: string,
		slotTypeId: string,
	) {
		const slot = await this.bookingRepository.getSlotById(slotId);
		if (!slot) {
			throw new NotFoundError("Slot not found");
		}

		// Check if slot is already booked
		const isBooked = await this.bookingRepository.isSlotBooked(slotId);
		if (isBooked) {
			throw new ConflictError("Slot is already booked");
		}

		// Validate that the slot type exists and is associated with this slot
		const slotWithDetails =
			await this.bookingRepository.getSlotWithDetails(slotId);
		if (!slotWithDetails) {
			throw new NotFoundError("Slot details not found");
		}

		// Check if the provided slotTypeId is valid for this slot
		const validSlotTypeIds = slotWithDetails.types.map((t) => t.id);
		if (!validSlotTypeIds.includes(slotTypeId)) {
			throw new BadRequestError("Invalid slot type for this slot");
		}

		const [physician, user, availability] = await Promise.all([
			this.userRepository.getUser(physicianId),
			this.userRepository.getUser(customerId),
			this.bookingRepository.getAvailabilityDateById(slot.availabilityId),
		]);

		if (!physician || !user) {
			throw new NotFoundError("User not found");
		}

		if (!availability) {
			throw new NotFoundError("Availability date not found");
		}

		const calculatedPrice = await this.calculateBookingPrice(
			physicianId,
			customerId,
		);

		const meeetingTimeUtc = this.bookingRepository.getStartTimeISO(
			availability.date,
			slot.startTime,
		);

		const result = await this.bookingRepository.createBookedSlotTransaction(
			{
				customerId,
				slotId,
				slotTypeId,
				status: BOOKING_STATUS_ENUM.PENDING,
				meetingTimeUtc: new Date(meeetingTimeUtc),
			},
			calculatedPrice,
		);
		const confirmCustomerNotificationPromise = this.pushNotificationService
			.sendDataOnlyToUser(customerId, {
				type: PUSH_MESSAGE_TYPE_ENUM.APPOINTMENT_BOOKED,
				title: "Appointment Booked",
				body: `You appointment with ${physician.firstName} ${physician.lastName} has been booked successfully. Check your email for the meeting link`,
				data: {},
			})
			.then()
			.catch(console.error);

		const physcianSlotBookedNotificationPromise = this.pushNotificationService
			.sendDataOnlyToUser(physicianId, {
				type: PUSH_MESSAGE_TYPE_ENUM.APPOINTMENT_BOOKED,
				title: "Appointment Booked",
				body: `You have a new appointment with ${user.firstName} ${user.lastName}. Check your email for the meeting link`,
				data: {},
			})
			.then()
			.catch(console.error);

		return result;
	}

	async sendMeetingReminderJob(minutesToSendReminderBefore: number) {
		await this.bookingRepository.getBookedSlotsForReminder(
			minutesToSendReminderBefore,
			async (data) => {
				await Promise.allSettled(
					data.map(async (d) => {
						await this.pushNotificationService.sendDataOnlyToUser(d.userId, {
							type: PUSH_MESSAGE_TYPE_ENUM.APPOINTMENT_REMINDER,
							title: "Appointment Reminder",
							body: "Your appointment is coming up soon. Please check your email for the meeting link",
							data: {},
						});
						await emailService.sendMeetingLinkReminderEmail(d);
					}),
				);
			},
		);
	}

	async getLatestPhysicianTrackingPatient(patientId: string) {
		return await this.bookingRepository.getLatestPhysicianTrackingPatient(
			patientId,
		);
	}

	private generateSlots(
		startTime: string,
		endTime: string,
		slotSizeMinutes: number,
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
		return DateManager.timeToMinutes(time);
	}

	private minutesToTime(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
	}

	async getPhysicianDatesWithSlots(
		physicianId: string,
		month: number,
		year: number,
		isCount: boolean,
		selectedDate: string,
	) {
		const currentDate = new Date();
		const monthsDiff =
			(year - currentDate.getFullYear()) * 12 +
			(month - currentDate.getMonth());

		// Limit to 12 months in the past and 12 months in the future
		if (monthsDiff < -12 || monthsDiff > 12) {
			throw new BadRequestError(
				"Query range limited to 12 months in the past and 12 months in the future",
			);
		}

		type PhysicianDatesWithSlots = {
			dates: Array<{ date: string; count: number }> | [];
			slots: Array<SlotWithDetails>;
		};
		const result: PhysicianDatesWithSlots = {
			dates: [],
			slots: [],
		};

		// If isCount is true, get dates with counts
		if (isCount) {
			result.dates = await this.bookingRepository.getDatesWithCountsForMonth(
				physicianId,
				month,
				year,
			);
		}

		result.slots = await this.bookingRepository.getOrganizedSlotsForDate(
			physicianId,
			selectedDate,
		);

		return result;
	}

	/**
	 * Calculate booking price based on consultation fee and user subscription status
	 * Returns the price breakdown with original fee, discounted fee (if applicable), and final price
	 */
	async calculateBookingPrice(
		physicianId: string,
		customerId: string,
	): Promise<BookingPriceCalculation> {
		// Get physician consultation fee
		const [physician] = await db
			.select({
				consultationFee: physicianData.consultationFee,
			})
			.from(physicianData)
			.where(eq(physicianData.userId, physicianId))
			.limit(1);

		if (!physician || !physician.consultationFee) {
			throw new NotFoundError("Physician consultation fee not found");
		}

		const originalFee = parseFloat(physician.consultationFee);

		// Get customer user data
		const customer = await this.userRepository.getUser(customerId);
		if (!customer) {
			throw new NotFoundError("Customer not found");
		}

		if (customer.paymentType === PAYMENT_TYPE.FREE) {
			return {
				originalFee: originalFee.toFixed(2),
				discountedFee: "0",
				finalPrice: originalFee.toFixed(2),
				isFree: false,
				isDiscounted: false,
				discountPercentage: 0,
				type: BOOKING_TYPE_ENUM.PAID,
			};
		}

		// Get user consultation quota
		const quota =
			await this.consultationService.getOrCreateUserConsultationQuota(
				customerId,
			);

		// Get system-wide quota limits
		const systemLimits = await this.settingsService.getLogLimits();
		const discountedQuotaLimit = systemLimits.discountedConsultationQuota || 0;
		const freeQuotaLimit = systemLimits.freeConsultationQuota || 0;

		// Check if user is paid (paymentType is not 'free')
		const isPaid = customer.paymentType !== "free";
		const paymentType = customer.paymentType; // monthly, annual, or free

		// Calculate price based on user status
		let finalPrice = originalFee;
		let discountedFee: string | null = null;
		let discountPercentage: number | undefined;
		let type = BOOKING_TYPE_ENUM.PAID;

		if (isPaid) {
			// For paid users
			if (paymentType === "annual") {
				// Annual users get free consultations if quota not exhausted
				if (quota.freeConsultationsUsed < freeQuotaLimit) {
					finalPrice = 0;
					type = BOOKING_TYPE_ENUM.FREE;
				} else if (quota.discountedConsultationsUsed < discountedQuotaLimit) {
					// Apply discount (assuming 20% discount, adjust as needed)
					discountPercentage = 20;
					discountedFee = (originalFee * 0.8).toFixed(2);
					finalPrice = parseFloat(discountedFee);
					type = BOOKING_TYPE_ENUM.DISCOUNTED;
				} else {
					// No discount, pay original fee
					finalPrice = originalFee;
				}
			} else {
				// Monthly users get discounted consultations if quota not exhausted
				if (quota.discountedConsultationsUsed < discountedQuotaLimit) {
					// Apply discount (assuming 20% discount, adjust as needed)
					discountPercentage = 20;
					discountedFee = (originalFee * 0.8).toFixed(2);
					finalPrice = parseFloat(discountedFee);
					type = BOOKING_TYPE_ENUM.DISCOUNTED;
				} else {
					// No discount, pay original fee
					finalPrice = originalFee;
				}
			}
		} else {
			// Free tier users pay full price
			finalPrice = originalFee;
		}

		return {
			originalFee: originalFee.toFixed(2),
			discountedFee: discountedFee,
			finalPrice: finalPrice.toFixed(2),
			isFree: type === BOOKING_TYPE_ENUM.FREE,
			isDiscounted: type === BOOKING_TYPE_ENUM.DISCOUNTED,
			discountPercentage:
				type === BOOKING_TYPE_ENUM.FREE ? 100 : discountPercentage,
			type,
		};
	}

	/**
	 * Get user consultations (upcoming or past)
	 */
	async getUserConsultations(
		customerId: string,
		options: {
			type?: BOOKING_TYPE_QUERY_ENUM;
			page?: number;
			limit?: number;
			skip?: number;
			date?: string;
			timeZone?: string;
		} = {},
	) {
		return await this.bookingRepository.getUserConsultations(
			customerId,
			options,
		);
	}

	/**
	 * Mark consultation as attended
	 */
	async markConsultationAttended(bookingId: string, customerId: string) {
		return await this.bookingRepository.markConsultationAttended(
			bookingId,
			customerId,
		);
	}

	/**
	 * Update consultation summary (physician only)
	 */
	async updateConsultationSummary(
		bookingId: string,
		summary: string,
		physicianId: string,
	) {
		return await this.bookingRepository.updateConsultationSummary(
			bookingId,
			summary,
			physicianId,
		);
	}

	/**
	 * Update consultation status (admin only). Status must be one of the allowed DB enum values.
	 */
	async updateConsultationStatus(
		bookingId: string,
		status: BOOKING_STATUS_ENUM,
	) {
		return await this.bookingRepository.updateBookedSlotStatus(
			bookingId,
			status,
		);
	}

	/**
	 * Get appointments for physicians/admins
	 */
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
			onlyToday?: boolean;
		} = {},
	) {
		return await this.bookingRepository.getAppointments(
			physicianId,
			hasReadAllAppointments,
			options,
		);
	}

	/**
	 * Get dates with bookings for calendar view
	 */
	async getDatesWithBookings(
		physicianId: string | null,
		hasReadAllAppointments: boolean,
		month: number,
		year: number,
	) {
		return await this.bookingRepository.getDatesWithBookings(
			physicianId,
			hasReadAllAppointments,
			month,
			year,
		);
	}

	async generateSlotsForDay(
		physicianId: string,
		timeStamp: number,
		timeZone: string,
		slotSizeId: string,
	) {
		const result = await this.bookingRepository.generateSlotsForDay(
			physicianId,
			timeStamp,
			timeZone,
			slotSizeId,
		);
		return {
			...result,
		};
	}

	/**
	 * Bulk delete slots (only unbooked ones)
	 */
	async bulkDeleteSlots(slotIds: string[], physicianId: string) {
		return await this.bookingRepository.bulkDeleteSlots(slotIds, physicianId);
	}

	async getAvailabilitiesForDate(date: string) {
		return this.bookingRepository.getAvailabilitiesForDate(date);
	}

	async updateConsultationNotes(data: {
		bookingId: string;
		summary: string;
		summaryStatus: SUMMARY_STATUS_ENUM;
		medications: MedicineDosage[];
		physicianId: string;
		userId: string;
	}) {
		const user = await this.userRepository.getUser(data.userId);
		if (!user) {
			throw new BadRequestError("User not found");
		}
		const physician = await this.userRepository.getUser(data.physicianId);
		if (!physician) {
			throw new BadRequestError("Pysician not found");
		}

		return await this.bookingRepository.updateConsultationNotesTransaction(
			data,
		);
	}

	async getMeetingLink(bookingId: string, userId: string) {
		const user = await this.userRepository.getUser(userId);
		if (!user) {
			throw new BadRequestError("User not found");
		}

		const booking = await this.bookingRepository.getBookedSlotById(bookingId);
		if (!booking) {
			throw new BadRequestError("Booking not found");
		}

		if (!booking.meetingLink) {
			throw new NotFoundError("Meeting link not found");
		}

		const slot = await this.bookingRepository.getSlotById(booking.slotId);
		if (!slot) {
			throw new BadRequestError("Booked slot not found");
		}

		const availability = await this.bookingRepository.getAvailabilityDateById(
			slot.availabilityId,
		);
		if (!availability) {
			throw new BadRequestError("Availability date not found");
		}

		const bookingRoleMap: Record<UserRole, () => boolean> = {
			[USER_ROLES.ADMIN]: () => true,
			[USER_ROLES.CUSTOMER]: () => {
				return booking.customerId === userId;
			},
			[USER_ROLES.PHYSICIAN]: () => {
				return availability.physicianId === userId;
			},
		};

		const isAllowed = bookingRoleMap[user.role];
		if (!isAllowed) {
			throw new ForbiddenError(
				"You are not allowed to access this meeting link",
			);
		}

		if (booking.status !== BOOKING_STATUS_ENUM.COMPLETED)
			await this.bookingRepository.updateBookedSlotStatus(
				bookingId,
				BOOKING_STATUS_ENUM.COMPLETED,
			);

		return booking.meetingLink;
	}
}
