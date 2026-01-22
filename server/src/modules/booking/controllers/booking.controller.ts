import type { Response } from "express";
import { BookingService } from "../service/booking.service";
import { sendSuccess } from "../../../app/utils/response";
import { handleError } from "../../../shared/middleware/errorHandler";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { BadRequestError, ForbiddenError } from "../../../shared/errors";
import { USER_ROLES } from "@shared/schema";
import { DateManager } from "server/src/shared/utils/utils";
import { PERMISSIONS } from "@shared/schema";
import type {
	DateSlotCount,
	SlotWithDetails,
} from "../repository/booking.repository";
import { number } from "zod";

export type DatesWithSpecifiedDateSlots = {
	slots: SlotWithDetails[];
	bookedSlots: DateSlotCount[];
	availableSlots: DateSlotCount[];
};
export class BookingController {
	private bookingService: BookingService;

	constructor() {
		this.bookingService = new BookingService();
	}

	async getSlotSizes(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const sizes = await this.bookingService.getAllSlotSizes();
			sendSuccess(res, { sizes }, "Slot sizes retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getSlotTypes(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const types = await this.bookingService.getAllSlotTypes();
			sendSuccess(res, { types }, "Slot types retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createAvailabilityDate(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}

			const { date } = req.body;
			if (!date) {
				throw new BadRequestError("Date is required");
			}

			const dateObj = new Date(date);
			if (isNaN(dateObj.getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const availability = await this.bookingService.createAvailabilityDate(
				physicianId,
				date,
			);
			sendSuccess(
				res,
				{ availability },
				"Availability date created successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getAvailabilityDates(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}

			const dates = await this.bookingService.getAvailabilityDates(physicianId);
			sendSuccess(res, { dates }, "Availability dates retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getDatesWithAvailability(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const physicianId = req.params.physicianId || req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("Physician ID is required");
			}

			const dates =
				await this.bookingService.getDatesWithAvailability(physicianId);
			// Convert dates to ISO strings for JSON serialization
			const dateStrings = dates.map((d) => d.toISOString().split("T")[0]);
			sendSuccess(
				res,
				{ dates: dateStrings },
				"Dates with availability retrieved successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}

			const { date, slotSizeId, slotTimes, slotTypeIds, locationIds, timeZone } =
				req.body;

			if (!date || !slotSizeId || !Array.isArray(slotTimes) ||  !slotTypeIds) {
				throw new BadRequestError("All fields are required");
			}

			if (!Array.isArray(slotTypeIds) || slotTypeIds.length === 0) {
				throw new BadRequestError("At least one slot type is required");
			}
			const numberDate = Number(date)
			if (isNaN(numberDate)) {
				throw new BadRequestError("Invalid date format");
			}

			if(!Intl.supportedValuesOf("timeZone").includes(timeZone)){
				throw new BadRequestError("Invalid timezone");
			}

			const dateWithTimezone = new Intl.DateTimeFormat("en-US",{
			  day: "numeric",
				month: "numeric",
				year:"numeric",
				hour:"numeric",
				minute:"numeric",
				second:"numeric",
				timeZone
			}).format(Number(date))

			const results = await  this.bookingService.createSlots(
				physicianId,
				dateWithTimezone,
				slotSizeId,
				slotTimes,
				slotTypeIds,
				locationIds,
			)

      const message = results.ignoredCount > 0
				? `Slots created successfully. ${results.ignoredCount} past slot(s) were ignored.`
				: "Slots created successfully";

			sendSuccess(res, { 
				slots: results.slots, 
				ignoredCount: results.ignoredCount 
			}, 
			message);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createCustomSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}

			const { date, startTime, endTime, slotTypeIds, locationIds, physicianId: adminPhysicianId } =
				req.body;

			if (!date || !startTime || !endTime || !Array.isArray(slotTypeIds)) {
				throw new BadRequestError("All required fields are missing");
			}

			if (slotTypeIds.length === 0) {
				throw new BadRequestError("At least one slot type is required");
			}

			const dateObj = new Date(date);
			if (isNaN(dateObj.getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			// Use admin's selected physician ID if provided, otherwise use authenticated user's ID
			const targetPhysicianId = adminPhysicianId || physicianId;

			const slot = await this.bookingService.createCustomSlot(
				targetPhysicianId,
				date,
				startTime,
				endTime,
				slotTypeIds,
				locationIds,
			);

			sendSuccess(res, { slot }, "Custom slot created successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getSlotsForDate(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const physicianId = req.params.physicianId || req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("Physician ID is required");
			}

			const { date } = req.query;
			if (!date || typeof date !== "string") {
				throw new BadRequestError("Date query parameter is required");
			}

			const dateObj = new Date(date);
			if (isNaN(dateObj.getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const slots = await this.bookingService.getSlotDetailsForDate(
				physicianId,
				date,
			);
			sendSuccess(res, { slots }, "Slots retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getAvailableSlotsForDate(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const physicianId = req.params.physicianId;
			if (!physicianId) {
				throw new BadRequestError("Physician ID is required");
			}

			const { date } = req.query;
			if (!date || typeof date !== "string") {
				throw new BadRequestError("Date query parameter is required");
			}

			const dateObj = new Date(date);
			if (isNaN(dateObj.getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const slots = await this.bookingService.getAvailableSlotsForDate(
				physicianId,
				date,
			);
			sendSuccess(res, { slots }, "Available slots retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async deleteSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}

			const { slotId } = req.params;
			if (!slotId) {
				throw new BadRequestError("Slot ID is required");
			}

			await this.bookingService.deleteSlot(slotId, physicianId);
			sendSuccess(res, null, "Slot deleted successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updateSlotPrice(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const isAdmin = req.user?.role === USER_ROLES.ADMIN;

			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const { priceId } = req.params;
			const { price } = req.body;

			if (!priceId) {
				throw new BadRequestError("Price ID is required");
			}

			if (!price) {
				throw new BadRequestError("Price is required");
			}

			const updatedPrice = await this.bookingService.updateSlotPrice(
				priceId,
				price,
				isAdmin ? undefined : userId,
				isAdmin,
			);

			sendSuccess(
				res,
				{ price: updatedPrice },
				"Slot price updated successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updateSlotLocations(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const isAdmin = req.user?.role === USER_ROLES.ADMIN;

			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const { slotId } = req.params;
			const { locationIds } = req.body;

			if (!slotId) {
				throw new BadRequestError("Slot ID is required");
			}

			if (!Array.isArray(locationIds)) {
				throw new BadRequestError("locationIds must be an array");
			}

			const updatedLocations = await this.bookingService.updateSlotLocations(
				slotId,
				locationIds,
				isAdmin ? undefined : userId,
				isAdmin,
			);

			sendSuccess(
				res,
				{ locations: updatedLocations },
				"Slot locations updated successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updateSlot(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const userPermissions = req.user?.permissions || [];
			const isAdmin = req.user?.role === USER_ROLES.ADMIN;

			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const hasManageAllSlots = userPermissions.includes(
				PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
			);
			const hasManageOwnSlots = userPermissions.includes(
				PERMISSIONS.MANAGE_OWN_SLOTS,
			);

			if (!hasManageAllSlots && !hasManageOwnSlots) {
				throw new ForbiddenError("You do not have permission to manage slots");
			}

			const { slotId } = req.params;
			const { startTime, endTime, slotTypeIds, locationIds } = req.body;

			if (!slotId) {
				throw new BadRequestError("Slot ID is required");
			}

			const updateData: {
				startTime?: string;
				endTime?: string;
				slotTypeIds?: string[];
				locationIds?: string[];
			} = {};

			if (startTime !== undefined) {
				if (typeof startTime !== "string") {
					throw new BadRequestError("startTime must be a string");
				}
				updateData.startTime = startTime;
			}

			if (endTime !== undefined) {
				if (typeof endTime !== "string") {
					throw new BadRequestError("endTime must be a string");
				}
				updateData.endTime = endTime;
			}

			if (slotTypeIds !== undefined) {
				if (!Array.isArray(slotTypeIds)) {
					throw new BadRequestError("slotTypeIds must be an array");
				}
				updateData.slotTypeIds = slotTypeIds;
			}

			if (locationIds !== undefined) {
				if (!Array.isArray(locationIds)) {
					throw new BadRequestError("locationIds must be an array");
				}
				updateData.locationIds = locationIds;
			}

			const updatedSlot = await this.bookingService.updateSlot(
				slotId,
				updateData,
				isAdmin ? undefined : userId,
				isAdmin,
			);

			sendSuccess(
				res,
				{ slot: updatedSlot },
				"Slot updated successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async bookSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const customerId = req.user?.userId;
			if (!customerId) {
				throw new BadRequestError("User ID not found");
			}

			const { slotId, slotTypeId } = req.body;
			if (!slotId) {
				throw new BadRequestError("Slot ID is required");
			}
			if (!slotTypeId) {
				throw new BadRequestError("Slot type ID is required");
			}

			const booking = await this.bookingService.bookSlot(
				customerId,
				slotId,
				slotTypeId,
			);
			sendSuccess(res, { booking }, "Slot booked successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPhysicianDates(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { physicianId } = req.params;
			if (!physicianId) {
				throw new BadRequestError("Physician ID is required");
			}

			const { month, year, isCount, selectedDate } = req.query;

			if (!month || !year || isCount === undefined) {
				throw new BadRequestError("Month, year, and isCount are required");
			}

			const monthNum = parseInt(month as string, 10);
			const yearNum = parseInt(year as string, 10);
			const isCountBool = isCount === "true";

			if (isNaN(monthNum) || isNaN(yearNum)) {
				throw new BadRequestError("Month and year must be valid numbers");
			}
			if (monthNum < 1 || monthNum > 12) {
				throw new BadRequestError("Invalid month. Must be between 1 and 12");
			}

			if (yearNum < 2020 || yearNum > 2100) {
				throw new BadRequestError(
					"Invalid year. Must be between 2020 and 2100",
				);
			}

			if (!selectedDate) {
				throw new BadRequestError("Selected date is required");
			}

			const selectedDateObj = DateManager.parseLocalDate(selectedDate as string);
			if (isNaN(selectedDateObj.getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const isBeforeToday = (inputDate: Date) => {
				const dateToCheck = inputDate;
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				return dateToCheck < today;
			};

			if (isBeforeToday(selectedDateObj)) {
				throw new BadRequestError(
					"Selected date must be today or in the future",
				);
			}

			const result = await this.bookingService.getPhysicianDatesWithSlots(
				physicianId,
				monthNum,
				yearNum,
				isCountBool,
				selectedDate as string,
			);

			sendSuccess(res, result, "Physician dates retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async calculateBookingPrice(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const customerId = req.user?.userId;
			if (!customerId) {
				throw new BadRequestError("User ID not found");
			}

			const { physicianId } = req.params;
			if (!physicianId) {
				throw new BadRequestError("Physician ID is required");
			}

			const priceCalculation = await this.bookingService.calculateBookingPrice(
				physicianId,
				customerId,
			);
			sendSuccess(
				res,
				{ price: priceCalculation },
				"Booking price calculated successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getUserConsultations(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const customerId = req.user?.userId;
			if (!customerId) {
				throw new BadRequestError("User ID not found");
			}

			const type = req.query.type as "upcoming" | "past" | undefined;
			const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
			const limit = req.query.limit
				? parseInt(req.query.limit as string, 10)
				: 10;
			const skip = parseInt(req.query.skip as string, 10);

			if (page < 1 || limit < 1 || skip < 0) {
				throw new BadRequestError("Page and limit must be positive integers");
			}

			const result = await this.bookingService.getUserConsultations(
				customerId,
				{
					type,
					page,
					limit,
					skip,
				},
			);

			sendSuccess(res, result, "Consultations retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async markConsultationAttended(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const customerId = req.user?.userId;
			if (!customerId) {
				throw new BadRequestError("User ID not found");
			}

			const { bookingId } = req.params;
			if (!bookingId) {
				throw new BadRequestError("Booking ID is required");
			}

			await this.bookingService.markConsultationAttended(bookingId, customerId);
			sendSuccess(res, {}, "Consultation marked as attended");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getAppointments(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const userRole = req.user?.role;
			const userPermissions = req.user?.permissions || [];

			if (!userId || !userRole) {
				throw new BadRequestError("User information not found");
			}

			const { page, limit, search, startDate, endDate, skip } = req.query;

			const options: {
				page?: number;
				limit?: number;
				search?: string;
				startDate?: string;
				endDate?: string;
				skip?: number;
			} = {};

			if (page) {
				const pageNum = parseInt(page as string, 10);
				if (isNaN(pageNum) || pageNum < 1) {
					throw new BadRequestError("Invalid page number");
				}
				options.page = pageNum;
			}

			if (limit) {
				const limitNum = parseInt(limit as string, 10);
				if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
					throw new BadRequestError("Invalid limit. Must be between 1 and 100");
				}
				options.limit = limitNum;
			}

			if (skip) {
				const skipNum = parseInt(skip as string, 10);
				if (isNaN(skipNum) || skipNum < 0) {
					throw new BadRequestError("Invalid skip number");
				}
				options.skip = skipNum;
			}

			if (search) {
				options.search = search as string;
			}

			if (startDate) {
				const start = new Date(startDate as string);
				if (isNaN(start.getTime())) {
					throw new BadRequestError("Invalid start date format");
				}
				options.startDate = startDate as string;
			}

			if (endDate) {
				const end = new Date(endDate as string);
				if (isNaN(end.getTime())) {
					throw new BadRequestError("Invalid end date format");
				}
				options.endDate = endDate as string;
			}

			const hasReadAllAppointments = userPermissions.includes(
				PERMISSIONS.READ_ALL_APPOINTMENTS,
			);
			const hasReadOwnAppointments = userPermissions.includes(
				PERMISSIONS.READ_OWN_APPOINTMENTS,
			);

			if (!hasReadAllAppointments && !hasReadOwnAppointments) {
				throw new ForbiddenError(
					"You do not have permission to view appointments",
				);
			}

			const physicianId = hasReadAllAppointments ? null : userId;
			const result = await this.bookingService.getAppointments(
				physicianId,
				hasReadAllAppointments,
				options,
			);

			sendSuccess(res, result, "Appointments retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getDatesWithBookings(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const userPermissions = req.user?.permissions || [];

			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const hasReadAllAppointments = userPermissions.includes(
				PERMISSIONS.READ_ALL_APPOINTMENTS,
			);
			const hasReadOwnAppointments = userPermissions.includes(
				PERMISSIONS.READ_OWN_APPOINTMENTS,
			);

			if (!hasReadAllAppointments && !hasReadOwnAppointments) {
				throw new ForbiddenError(
					"You do not have permission to view appointments",
				);
			}

			const physicianId = hasReadAllAppointments ? null : userId;

			const { month, year, selectedDate } = req.query;
			if (!month || !year) {
				throw new BadRequestError("Month and year are required");
			}

			const monthNum = parseInt(month as string, 10);
			const yearNum = parseInt(year as string, 10);

			if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
				throw new BadRequestError("Invalid month or year");
			}

			const data = await this.bookingService.getDatesWithBookings(
				physicianId,
				hasReadAllAppointments,
				monthNum,
				yearNum,
			);

			const slots: SlotWithDetails[] = [];
			const datesWithSpecifiedDateSlots: DatesWithSpecifiedDateSlots = {
				...data,
				slots,
			};

			if (!selectedDate) {
				return sendSuccess(
					res,
					datesWithSpecifiedDateSlots,
					"Dates with bookings retrieved successfully",
				);
			}

			const selectedDateObj = DateManager.parseLocalDate(selectedDate as string);
			if (isNaN(selectedDateObj.getTime())) {
				throw new BadRequestError("invalid selected date provided");
			}

			if (physicianId) {
				const availabilities = await this.bookingService.getSlotsForDate(
					physicianId,
					selectedDate as string,
				);
				datesWithSpecifiedDateSlots.slots.push(...availabilities);
			} else {
				const availabilitiesByDate =
					await this.bookingService.getAvailabilitiesForDate(
						selectedDate as string,
					);
				const availabilities = await Promise.all(
					availabilitiesByDate.map((a) =>
						this.bookingService.getSlotsForDate(a.physicianId, a.date),
					),
				);
				datesWithSpecifiedDateSlots.slots.push(...availabilities.flat());
			}

			sendSuccess(
				res,
				datesWithSpecifiedDateSlots,
				"Dates with bookings retrieved successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async generateSlotsForDay(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		const { physicianId: paramPhysicianId, date, slotSizeId, timeZone } = req.body;
		try {
			const userId = req.user?.userId;
			const userPermissions = req.user?.permissions || [];

			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const hasManageAllSlots = userPermissions.includes(
				PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
			);
			const hasManageOwnSlots = userPermissions.includes(
				PERMISSIONS.MANAGE_OWN_SLOTS,
			);

			if (!hasManageAllSlots && !hasManageOwnSlots) {
				throw new ForbiddenError("You do not have permission to manage slots");
			}

			if(!Intl.supportedValuesOf("timeZone").includes(timeZone)){
				throw new BadRequestError("Invalid timezone");
			}


			// For admin, require physicianId; for physician, use their own ID
			const physicianId = hasManageAllSlots
				? paramPhysicianId || userId
				: userId;

			if (!date || !slotSizeId) {
				throw new BadRequestError("Date and slotSizeId are required");
			}

			const timestamp = Number(date)
			if (isNaN(timestamp) || isNaN(new Date(timestamp).getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const dateWithTimezone = new Intl.DateTimeFormat("en-US",{
			  day: "numeric",
				month: "numeric",
				year:"numeric",
				hour:"numeric",
				minute:"numeric",
				second:"numeric",
				timeZone
			}).format(timestamp)

			const result = await this.bookingService.generateSlotsForDay(
				physicianId,
				dateWithTimezone,
				slotSizeId,
			);

			sendSuccess(res, result, "Slots generated successfully");
		} catch (error: any) {
			const today = new Date().toISOString();
			const providedDate = new Date(date).toISOString();
			handleError(res, error, { today, providedDate });
		}
	}

	async bulkDeleteSlots(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			const userPermissions = req.user?.permissions || [];

			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const hasManageAllSlots = userPermissions.includes(
				PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
			);
			const hasManageOwnSlots = userPermissions.includes(
				PERMISSIONS.MANAGE_OWN_SLOTS,
			);

			if (!hasManageAllSlots && !hasManageOwnSlots) {
				throw new ForbiddenError("You do not have permission to manage slots");
			}

			const { slotIds, physicianId: paramPhysicianId } = req.body;

			if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
				throw new BadRequestError("slotIds array is required");
			}

			if (hasManageAllSlots && !paramPhysicianId) {
				throw new BadRequestError("Physician ID is required");
			}

			// For admin, require physicianId; for physician, use their own ID
			const physicianId = hasManageAllSlots ? paramPhysicianId : userId;

			const result = await this.bookingService.bulkDeleteSlots(
				slotIds,
				physicianId,
			);

			sendSuccess(res, result, "Slots deleted successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}
}
