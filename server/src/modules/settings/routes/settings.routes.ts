import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { authenticateToken, requirePermission } from "../../../shared/middleware/auth";

const router = Router();
const settingsController = new SettingsController();

/**
 * @swagger
 * /api/settings/limits:
 *   get:
 *     summary: Get all limits configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the current limits for health metrics (glucose, steps, water) and food scanning (free and paid users)
 *     responses:
 *       200:
 *         description: Limits retrieved successfully
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
 *                         id:
 *                           type: string
 *                         glucoseLimit:
 *                           type: integer
 *                         stepsLimit:
 *                           type: integer
 *                         waterLimit:
 *                           type: integer
 *                         discountedConsultationQuota:
 *                           type: integer
 *                         freeConsultationQuota:
 *                           type: integer
 *                         foodScanLimits:
 *                           type: object
 *                           properties:
 *                             freeTier:
 *                               type: integer
 *                             paidTier:
 *                               type: integer
 *                         createdAt:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/limits", authenticateToken, (req, res, next) => 
  settingsController.getLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/limits:
 *   post:
 *     summary: Create limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Create new limits. Will fail if limits already exist. Supports both health metrics and food scan limits.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               glucoseLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *                 description: Maximum number of glucose logs per day for free tier users
 *               stepsLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *                 description: Maximum number of steps logs per day for free tier users
 *               waterLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *                 description: Maximum number of water intake logs per day for free tier users
 *               discountedConsultationQuota:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *               freeConsultationQuota:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *               freeUserScanLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5
 *                 description: Maximum number of food scans per day for free users
 *               paidUserScanLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 20
 *                 description: Maximum number of food scans per day for paid users
 *     responses:
 *       201:
 *         description: Limits created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       400:
 *         description: Bad request - validation error or limits already exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/limits", authenticateToken, requirePermission('create:settings'), (req, res, next) => 
  settingsController.createLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/limits:
 *   put:
 *     summary: Create or update limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Upsert operation - creates limits if they don't exist, or updates if they do. Supports both health metrics and food scan limits.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               glucoseLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 3
 *                 description: Maximum number of glucose logs per day for free tier users
 *               stepsLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 3
 *                 description: Maximum number of steps logs per day for free tier users
 *               waterLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 3
 *                 description: Maximum number of water intake logs per day for free tier users
 *               discountedConsultationQuota:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *               freeConsultationQuota:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *               freeUserScanLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *                 description: Maximum number of food scans per day for free users
 *               paidUserScanLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 30
 *                 description: Maximum number of food scans per day for paid users
 *     responses:
 *       200:
 *         description: Limits updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/limits", authenticateToken, requirePermission('update:settings'), (req, res, next) => 
  settingsController.upsertLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/limits:
 *   patch:
 *     summary: Partially update limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Update only specified limit fields. Limits must already exist. Supports both health metrics and food scan limits.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               glucoseLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5
 *                 description: Maximum number of glucose logs per day for free tier users
 *               stepsLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 4
 *                 description: Maximum number of steps logs per day for free tier users
 *               waterLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 3
 *                 description: Maximum number of water intake logs per day for free tier users
 *               discountedConsultationQuota:
 *                 type: integer
 *                 minimum: 0
 *               freeConsultationQuota:
 *                 type: integer
 *                 minimum: 0
 *               freeUserScanLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 8
 *                 description: Maximum number of food scans per day for free users
 *               paidUserScanLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 25
 *                 description: Maximum number of food scans per day for paid users
 *     responses:
 *       200:
 *         description: Limits updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Limits not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/limits", authenticateToken, requirePermission('update:settings'), (req, res, next) => 
  settingsController.updateLimits(req, res, next)
);






/**
 * @swagger
 * /api/settings/food-scan-status:
 *   get:
 *     summary: Get user's food scan status
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Returns whether the user can scan food today and their current scan count
 *     responses:
 *       200:
 *         description: User scan status retrieved successfully
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
 *                         canScan:
 *                           type: boolean
 *                           description: Whether the user can scan food today
 *                         currentCount:
 *                           type: integer
 *                           description: Number of scans performed today
 *                         limit:
 *                           type: integer
 *                           description: Daily scan limit for the user
 *       401:
 *         description: Unauthorized
 */
router.get("/food-scan-status", authenticateToken, (req, res, next) => 
  settingsController.getUserScanStatus(req, res, next))

export { router as settingsRoutes };


