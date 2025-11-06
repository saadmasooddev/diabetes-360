import { type Request, Response, NextFunction } from "express";
import { BookingService } from "../service/booking.service";
import { sendSuccess } from "../../../app/utils/response";
import { handleError } from "../../../shared/middleware/errorHandler";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { BadRequestError } from "../../../shared/errors";
import { USER_ROLES } from "../../../shared/constants/roles";

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
    res: Response
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
        dateObj
      );
      sendSuccess(res, { availability }, "Availability date created successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAvailabilityDates(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    res: Response
  ): Promise<void> {
    try {
      const physicianId = req.params.physicianId || req.user?.userId;
      if (!physicianId) {
        throw new BadRequestError("Physician ID is required");
      }

      const dates = await this.bookingService.getDatesWithAvailability(physicianId);
      // Convert dates to ISO strings for JSON serialization
      const dateStrings = dates.map((d) => d.toISOString().split('T')[0]);
      sendSuccess(res, { dates: dateStrings }, "Dates with availability retrieved successfully");
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

      const { date, slotSizeId, startTime, endTime, slotTypeIds, prices } = req.body;

      if (!date || !slotSizeId || !startTime || !endTime || !slotTypeIds || !prices) {
        throw new BadRequestError("All fields are required");
      }

      if (!Array.isArray(slotTypeIds) || slotTypeIds.length === 0) {
        throw new BadRequestError("At least one slot type is required");
      }

      if (!Array.isArray(prices) || prices.length === 0) {
        throw new BadRequestError("At least one price is required");
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new BadRequestError("Invalid date format");
      }

      const slots = await this.bookingService.createSlots(
        physicianId,
        dateObj,
        slotSizeId,
        startTime,
        endTime,
        slotTypeIds,
        prices
      );

      sendSuccess(res, { slots }, "Slots created successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getSlotsForDate(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const slots = await this.bookingService.getSlotDetailsForDate(physicianId, dateObj);
      sendSuccess(res, { slots }, "Slots retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAvailableSlotsForDate(
    req: AuthenticatedRequest,
    res: Response
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

      const slots = await this.bookingService.getAvailableSlotsForDate(physicianId, dateObj);
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

  async updateSlotPrice(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        isAdmin
      );

      sendSuccess(res, { price: updatedPrice }, "Slot price updated successfully");
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

      const { slotId } = req.body;
      if (!slotId) {
        throw new BadRequestError("Slot ID is required");
      }

      const booking = await this.bookingService.bookSlot(customerId, slotId);
      sendSuccess(res, { booking }, "Slot booked successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

