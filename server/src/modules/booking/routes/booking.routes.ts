import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { authenticateToken, requireAdmin, requirePhysician } from "../../../shared/middleware/auth";

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
  bookingController.getSlotSizes(req, res)
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
  bookingController.getSlotTypes(req, res)
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
router.get("/availability-dates", authenticateToken, requirePhysician, (req, res) =>
  bookingController.getAvailabilityDates(req, res)
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
router.post("/availability-dates", authenticateToken, requirePhysician, (req, res) =>
  bookingController.createAvailabilityDate(req, res)
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
router.get("/physicians/:physicianId/dates-with-availability", authenticateToken, (req, res) =>
  bookingController.getDatesWithAvailability(req, res)
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
router.post("/slots", authenticateToken, requirePhysician, (req, res) =>
  bookingController.createSlots(req, res)
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
  bookingController.getSlotsForDate(req, res)
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
router.get("/physicians/:physicianId/available-slots", authenticateToken, (req, res) =>
  bookingController.getAvailableSlotsForDate(req, res)
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
router.delete("/slots/:slotId", authenticateToken, requirePhysician, (req, res) =>
  bookingController.deleteSlot(req, res)
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
  bookingController.updateSlotPrice(req, res)
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
  bookingController.updateSlotLocations(req, res)
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
 *             properties:
 *               slotId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Slot booked successfully
 */
router.post("/book", authenticateToken, (req, res) =>
  bookingController.bookSlot(req, res)
);

export { router as bookingRoutes };

