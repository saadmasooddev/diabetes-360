import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import {
	authenticateToken,
	requirePermission,
	AuthenticatedRequest,
	requireAnyPermission,
} from "../../../shared/middleware/auth";
import { PERMISSIONS } from "@shared/schema";

const router = Router();
const bookingController = new BookingController();

/**
 * @swagger
 * /api/booking/slot-sizes:
 *   get:
 *     summary: Get all available slot sizes
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slot sizes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sizes:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               size:
 *                                 type: integer
 *                                 example: 30
 */
router.get("/slot-sizes", authenticateToken, (req, res) =>
	bookingController.getSlotSizes(req, res),
);

/**
 * @swagger
 * /api/booking/slot-types:
 *   get:
 *     summary: Get all available slot types
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slot types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         types:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                                 example: online
 */
router.get("/slot-types", authenticateToken, (req, res) =>
	bookingController.getSlotTypes(req, res),
);

/**
 * @swagger
 * /api/booking/availability-dates:
 *   get:
 *     summary: Get all availability dates for the authenticated physician
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Availability dates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         dates:
 *                           type: array
 *                           items:
 *                             type: object
 */
router.get(
	"/availability-dates",
	authenticateToken,
	requirePermission(PERMISSIONS.MANAGE_AVAILABILITY),
	(req, res) => bookingController.getAvailabilityDates(req, res),
);

/**
 * @swagger
 * /api/booking/availability-dates:
 *   post:
 *     summary: Create an availability date for the authenticated physician
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-25T00:00:00Z"
 *     responses:
 *       200:
 *         description: Availability date created successfully
 */
router.post(
	"/availability-dates",
	authenticateToken,
	requirePermission(PERMISSIONS.MANAGE_AVAILABILITY),
	(req, res) => bookingController.createAvailabilityDate(req, res),
);

/**
 * @swagger
 * /api/booking/physicians/{physicianId}/dates-with-availability:
 *   get:
 *     summary: Get dates with availability for a physician
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Physician ID
 *     responses:
 *       200:
 *         description: Dates with availability retrieved successfully
 */
router.get(
	"/physicians/:physicianId/dates-with-availability",
	authenticateToken,
	(req, res) => bookingController.getDatesWithAvailability(req, res),
);

/**
 * @swagger
 * /api/booking/slots:
 *   post:
 *     summary: Create slots for a date
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - slotSizeId
 *               - startTime
 *               - endTime
 *               - slotTypeIds
 *               - prices
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               slotSizeId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 example: "09:00:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00:00"
 *               slotTypeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               prices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     slotTypeId:
 *                       type: string
 *                     price:
 *                       type: string
 *               locationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of location IDs for offline/onsite consultations (optional)
 *                 example: ["loc-123", "loc-456"]
 *     responses:
 *       200:
 *         description: Slots created successfully
 */
router.post(
	"/slots",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.MANAGE_OWN_SLOTS,
		PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
	]),
	(req, res) => bookingController.createSlots(req, res),
);

/**
 * @swagger
 * /api/booking/custom-slot:
 *   post:
 *     summary: Create a custom-sized slot with exact start and end times
 *     description: |
 *       Creates a custom slot with user-defined start and end times.
 *       - Start and end times must be in the future (if date is today)
 *       - End time must be after start time
 *       - No minimum duration restriction (can be any duration)
 *       - Maximum duration is 8 hours
 *       - Automatically marks slot as custom and stores actual duration
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *               - slotTypeIds
 *             properties:
 *               physicianId:
 *                 type: string
 *                 description: Physician ID (required for admin, optional for physician)
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *                 description: Date for the slot (must be today or future date)
 *               startTime:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *                 description: Start time in HH:MM:SS format (must be in future if date is today)
 *               endTime:
 *                 type: string
 *                 format: time
 *                 example: "10:30:00"
 *                 description: End time in HH:MM:SS format (must be after start time and in future if date is today)
 *               slotTypeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of slot type IDs (e.g., online, onsite)
 *               locationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of location IDs (required if slotTypeIds includes onsite)
 *     responses:
 *       200:
 *         description: Custom slot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         slot:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             startTime:
 *                               type: string
 *                             endTime:
 *                               type: string
 *                             isCustom:
 *                               type: boolean
 *                             durationMinutes:
 *                               type: integer
 *       400:
 *         description: Bad request - validation error (past date, invalid times, etc.)
 *       409:
 *         description: Conflict - slot overlaps with existing slots
 */
router.post(
	"/custom-slot",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
		PERMISSIONS.MANAGE_OWN_SLOTS,
	]),
	(req, res) => bookingController.createCustomSlot(req, res),
);

/**
 * @swagger
 * /api/booking/physicians/{physicianId}/slots:
 *   get:
 *     summary: Get slots for a physician on a specific date
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Slots retrieved successfully
 */
router.get("/physicians/:physicianId/slots", authenticateToken, (req, res) =>
	bookingController.getSlotsForDate(req, res),
);

/**
 * @swagger
 * /api/booking/physicians/{physicianId}/available-slots:
 *   get:
 *     summary: Get available (unbooked) slots for a physician on a specific date
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 */
router.get(
	"/physicians/:physicianId/available-slots",
	authenticateToken,
	(req, res) => bookingController.getAvailableSlotsForDate(req, res),
);

/**
 * @swagger
 * /api/booking/slots/{slotId}:
 *   delete:
 *     summary: Delete a slot (physician only, cannot delete booked slots)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot deleted successfully
 */
router.delete(
	"/slots/:slotId",
	authenticateToken,
	requirePermission(PERMISSIONS.MANAGE_OWN_SLOTS),
	(req, res) => bookingController.deleteSlot(req, res),
);

/**
 * @swagger
 * /api/booking/slot-prices/{priceId}:
 *   patch:
 *     summary: Update slot price (physician or admin, cannot update booked slots)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: priceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *             properties:
 *               price:
 *                 type: string
 *     responses:
 *       200:
 *         description: Slot price updated successfully
 */
router.patch("/slot-prices/:priceId", authenticateToken, (req, res) =>
	bookingController.updateSlotPrice(req, res),
);

/**
 * @swagger
 * /api/booking/slots/{slotId}/locations:
 *   patch:
 *     summary: Update slot locations (physician or admin, cannot update booked slots)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationIds
 *             properties:
 *               locationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of location IDs for offline/onsite consultations
 *                 example: ["loc-123", "loc-456"]
 *     responses:
 *       200:
 *         description: Slot locations updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         locations:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Invalid request (slot is booked or invalid data)
 *       403:
 *         description: Forbidden (not the slot owner or admin)
 *       404:
 *         description: Slot not found
 */
router.patch("/slots/:slotId/locations", authenticateToken, (req, res) =>
	bookingController.updateSlotLocations(req, res),
);

/**
 * @swagger
 * /api/booking/slots/{slotId}:
 *   patch:
 *     summary: Update a slot (physician or admin, cannot update booked slots)
 *     description: |
 *       Updates slot properties. For custom slots, start/end times can be updated.
 *       For non-custom slots, only slot types and locations can be updated.
 *       - Slot types can be added/removed (at least one must remain)
 *       - Locations can be updated for offline/onsite consultations
 *       - Start/end times can only be updated for custom slots
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *                 description: Start time in HH:MM:SS format (only for custom slots)
 *               endTime:
 *                 type: string
 *                 format: time
 *                 example: "10:30:00"
 *                 description: End time in HH:MM:SS format (only for custom slots)
 *               slotTypeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of slot type IDs (at least one required)
 *                 example: ["type-online-123", "type-onsite-456"]
 *               locationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of location IDs for offline/onsite consultations
 *                 example: ["loc-123"]
 *     responses:
 *       200:
 *         description: Slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         slot:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             startTime:
 *                               type: string
 *                             endTime:
 *                               type: string
 *                             isCustom:
 *                               type: boolean
 *                             types:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             locations:
 *                               type: array
 *                               items:
 *                                 type: object
 *       400:
 *         description: Invalid request (slot is booked, invalid data, or trying to update times for non-custom slot)
 *       403:
 *         description: Forbidden (not the slot owner or admin, or insufficient permissions)
 *       404:
 *         description: Slot not found
 *       409:
 *         description: Conflict (slot overlaps with existing slots)
 */
router.patch(
	"/slots/:slotId",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
		PERMISSIONS.MANAGE_OWN_SLOTS,
	]),
	(req, res) => bookingController.updateSlot(req, res),
);

/**
 * @swagger
 * /api/booking/book:
 *   post:
 *     summary: Book a slot (customer only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotId
 *               - slotTypeId
 *             properties:
 *               slotId:
 *                 type: string
 *                 description: The ID of the slot to book
 *                 example: "slot-123"
 *               slotTypeId:
 *                 type: string
 *                 description: The ID of the slot type (online/onsite) selected by the user. Must be one of the slot types available for this slot.
 *                 example: "type-online-123"
 *     responses:
 *       200:
 *         description: Slot booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         booking:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             slotId:
 *                               type: string
 *                             slotTypeId:
 *                               type: string
 *                             status:
 *                               type: string
 *                               enum: [pending, confirmed, cancelled, completed]
 *       400:
 *         description: Bad request (missing slotId or slotTypeId, invalid slot type, or slot already booked)
 *       404:
 *         description: Slot not found
 */
router.post("/book", authenticateToken, (req, res) =>
	bookingController.bookSlot(req, res),
);

/**
 * @swagger
 * /api/booking/physicians/{physicianId}/dates:
 *   get:
 *     summary: Get physician dates with availability counts and slots
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Physician ID (UUID)
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *         example: 12
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2100
 *         description: Year (2020-2100)
 *         example: 2024
 *       - in: query
 *         name: isCount
 *         required: true
 *         schema:
 *           type: boolean
 *         description: If true, returns dates with available booking counts. If false, skips the dates query.
 *         example: true
 *       - in: query
 *         name: selectedDate
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\\d{4}-\\d{2}-\\d{2}$'
 *         description: Selected date in YYYY-MM-DD format (e.g., 2024-12-25). Returns organized slots for this date.
 *         example: "2024-12-25"
 *     responses:
 *       200:
 *         description: Physician dates and slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         dates:
 *                           type: array
 *                           description: Array of dates with available booking counts (only if isCount is true)
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                                 example: "2024-12-25"
 *                               count:
 *                                 type: integer
 *                                 description: Number of available bookings for this date
 *                                 example: 5
 *                         slots:
 *                           type: array
 *                           description: Array of organized slots for the selected date (only if selectedDate is provided)
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: Slot ID (UUID)
 *                                 example: "123e4567-e89b-12d3-a456-426614174000"
 *                               startTime:
 *                                 type: string
 *                                 example: "09:00:00"
 *                               endTime:
 *                                 type: string
 *                                 example: "09:30:00"
 *                               slotSize:
 *                                 type: integer
 *                                 description: Slot size in minutes
 *                                 example: 30
 *                               types:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     type:
 *                                       type: string
 *                                       example: "online"
 *                                     price:
 *                                       type: string
 *                                       example: "100.00"
 *                               locations:
 *                                 type: array
 *                                 description: Locations for offline/onsite consultations (only if applicable)
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     locationName:
 *                                       type: string
 *                                     address:
 *                                       type: string
 *                                       nullable: true
 *                                     city:
 *                                       type: string
 *                                       nullable: true
 *                                     state:
 *                                       type: string
 *                                       nullable: true
 *                                     country:
 *                                       type: string
 *                                       nullable: true
 *                                     postalCode:
 *                                       type: string
 *                                       nullable: true
 *                                     latitude:
 *                                       type: string
 *                                     longitude:
 *                                       type: string
 *                               isBooked:
 *                                 type: boolean
 *                                 description: Whether the slot is already booked
 *       400:
 *         description: Bad request (invalid parameters, date format, or query range)
 *       404:
 *         description: Physician not found
 */
router.get("/physicians/:physicianId/dates", authenticateToken, (req, res) =>
	bookingController.getPhysicianDates(req, res),
);

/**
 * @swagger
 * /api/booking/physicians/{physicianId}/calculate-price:
 *   get:
 *     summary: Calculate booking price for a physician consultation
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Physician ID (UUID)
 *     responses:
 *       200:
 *         description: Booking price calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         price:
 *                           type: object
 *                           properties:
 *                             originalFee:
 *                               type: string
 *                               description: Original consultation fee
 *                               example: "100.00"
 *                             discountedFee:
 *                               type: string
 *                               nullable: true
 *                               description: Discounted fee if applicable
 *                               example: "80.00"
 *                             finalPrice:
 *                               type: string
 *                               description: Final price to be charged
 *                               example: "80.00"
 *                             isFree:
 *                               type: boolean
 *                               description: Whether the consultation is free
 *                             isDiscounted:
 *                               type: boolean
 *                               description: Whether a discount is applied
 *                             discountPercentage:
 *                               type: number
 *                               nullable: true
 *                               description: Discount percentage if applicable
 *                               example: 20
 *       400:
 *         description: Bad request
 *       404:
 *         description: Physician or customer not found
 */
router.get(
	"/physicians/:physicianId/calculate-price",
	authenticateToken,
	(req, res) => bookingController.calculateBookingPrice(req, res),
);

/**
 * @swagger
 * /api/booking/my-consultations:
 *   get:
 *     summary: Get user's consultations (upcoming or past)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [upcoming, past]
 *         description: Filter by consultation type (upcoming or past)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Consultations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         consultations:
 *                           type: array
 *                           items:
 *                             type: object
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 */
router.get("/my-consultations", authenticateToken, (req, res) =>
	bookingController.getUserConsultations(req, res),
);

/**
 * @swagger
 * /api/booking/consultations/{bookingId}/attend:
 *   patch:
 *     summary: Mark consultation as attended
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Consultation marked as attended successfully
 */
router.patch(
	"/consultations/:bookingId/attend",
	authenticateToken,
	(req, res) => bookingController.markConsultationAttended(req, res),
);

/**
 * @swagger
 * /api/booking/consultations/{bookingId}/status:
 *   patch:
 *     summary: Update consultation status (admin only)
 *     description: |
 *       Allows admin to set a consultation to any allowed database status.
 *       Allowed values are pending, confirmed, cancelled, completed.
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking (consultation) ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *                 description: New status for the consultation
 *     responses:
 *       200:
 *         description: Consultation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         booking:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             status:
 *                               type: string
 *                               enum: [pending, confirmed, cancelled, completed]
 *       400:
 *         description: Bad request (invalid status or missing fields)
 *       403:
 *         description: Forbidden (requires update:all_bookings permission)
 *       404:
 *         description: Booking not found
 */
router.patch(
	"/consultations/:bookingId/status",
	authenticateToken,
	requirePermission(PERMISSIONS.UPDATE_ALL_BOOKINGS),
	(req, res) => bookingController.updateConsultationStatus(req, res),
);


router.patch(
	"/consultations/:bookingId/note",
	authenticateToken,
	requireAnyPermission([PERMISSIONS.UPDATE_OWN_APPOINTMENTS, PERMISSIONS.UPDATE_ALL_BOOKINGS]),
	(req, res) => bookingController. updateConsultationNotes(req, res),
);

/**
 * @swagger
 * /api/booking/appointments:
 *   get:
 *     summary: Get appointments for physicians/admins
 *     description: |
 *       Returns paginated appointments. When caller has read_all_appointments (admin),
 *       all consultations in all statuses (pending, confirmed, cancelled, completed) are returned.
 *       When caller has only read_own_appointments (physician), only pending and confirmed are returned.
 *       Date range uses DATE(timestamp) for consistent results between startDate and endDate (inclusive).
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name (and physician name if user has read_all_appointments permission)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering appointments (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering appointments (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         appointments:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: Appointment ID
 *                               time:
 *                                 type: string
 *                                 description: Appointment time (HH:MM AM/PM)
 *                                 example: "09:00 AM"
 *                               date:
 *                                 type: string
 *                                 description: Appointment date (MM/DD/YYYY)
 *                                 example: "12/25/2024"
 *                               patientName:
 *                                 type: string
 *                                 description: Patient full name
 *                               type:
 *                                 type: string
 *                                 enum: [Video Call, In Person]
 *                                 description: Appointment type
 *                               doctorName:
 *                                 type: string
 *                                 description: Physician full name (always included in response)
 *                               status:
 *                                 type: string
 *                                 enum: [pending, confirmed, cancelled, completed]
 *                                 description: Appointment status
 *                         total:
 *                           type: integer
 *                           description: Total number of appointments
 *                         page:
 *                           type: integer
 *                           description: Current page number
 *                         limit:
 *                           type: integer
 *                           description: Number of items per page
 *       400:
 *         description: Bad request (invalid parameters)
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
// Middleware to check for either appointment permission

router.get(
	"/appointments",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.READ_ALL_APPOINTMENTS,
		PERMISSIONS.READ_OWN_APPOINTMENTS,
	]),
	(req, res) => bookingController.getAppointments(req, res),
);

/**
 * @swagger
 * /api/booking/dates-with-bookings:
 *   get:
 *     summary: Get dates with bookings for calendar view
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2100
 *         description: Year
 *       - in: query
 *         name: selectedDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Selected date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Dates with bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         dates:
 *                           type: array
 *                           items:
 *                             type: string
 *                             format: date
 */
router.get(
	"/dates-with-bookings",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.READ_ALL_APPOINTMENTS,
		PERMISSIONS.READ_OWN_APPOINTMENTS,
	]),
	(req, res) => bookingController.getDatesWithBookings(req, res),
);

/**
 * @swagger
 * /api/booking/generate-slots-for-day:
 *   post:
 *     summary: Generate available slots for a whole day with conflict detection
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - slotSizeId
 *             properties:
 *               physicianId:
 *                 type: string
 *                 description: Physician ID (required for admin, optional for physician)
 *               date:
 *                 type: string
 *                 format: date
 *               slotSizeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Slots generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         availableSlots:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               start:
 *                                 type: string
 *                               end:
 *                                 type: string
 *                         existingSlots:
 *                           type: array
 *                         conflicts:
 *                           type: array
 */
router.post(
	"/generate-slots-for-day",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
		PERMISSIONS.MANAGE_OWN_SLOTS,
	]),
	(req, res) => bookingController.generateSlotsForDay(req, res),
);

/**
 * @swagger
 * /api/booking/bulk-delete-slots:
 *   post:
 *     summary: Bulk delete slots (only unbooked ones)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotIds
 *             properties:
 *               physicianId:
 *                 type: string
 *                 description: Physician ID (required for admin, optional for physician)
 *               slotIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Slots deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deleted:
 *                           type: array
 *                           items:
 *                             type: string
 *                         failed:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               slotId:
 *                                 type: string
 *                               reason:
 *                                 type: string
 */
router.post(
	"/bulk-delete-slots",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
		PERMISSIONS.MANAGE_OWN_SLOTS,
	]),
	(req, res) => bookingController.bulkDeleteSlots(req, res),
);

export { router as bookingRoutes };
