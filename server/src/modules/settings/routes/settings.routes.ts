import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { authenticateToken, requirePermission } from "../../../shared/middleware/auth";

const router = Router();
const settingsController = new SettingsController();

/**
 * @swagger
 * /api/settings/free-tier-limits:
 *   get:
 *     summary: Get free tier limits configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the current free tier limits for glucose, steps, and water intake metrics
 *     responses:
 *       200:
 *         description: Free tier limits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FreeTierLimits'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/free-tier-limits", authenticateToken, (req, res, next) => 
  settingsController.getFreeTierLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/free-tier-limits:
 *   post:
 *     summary: Create free tier limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Create new free tier limits. Will fail if limits already exist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - glucoseLimit
 *               - stepsLimit
 *               - waterLimit
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
 *     responses:
 *       201:
 *         description: Free tier limits created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FreeTierLimits'
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
router.post("/free-tier-limits", authenticateToken, requirePermission('create:settings'), (req, res, next) => 
  settingsController.createFreeTierLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/free-tier-limits:
 *   put:
 *     summary: Create or update free tier limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Upsert operation - creates limits if they don't exist, or updates if they do
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - glucoseLimit
 *               - stepsLimit
 *               - waterLimit
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
 *     responses:
 *       200:
 *         description: Free tier limits updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FreeTierLimits'
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
router.put("/free-tier-limits", authenticateToken, requirePermission('update:settings'), (req, res, next) => 
  settingsController.upsertFreeTierLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/free-tier-limits:
 *   patch:
 *     summary: Partially update free tier limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Update only specified limit fields. Limits must already exist.
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
 *     responses:
 *       200:
 *         description: Free tier limits updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FreeTierLimits'
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
 *         description: Free tier limits not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/free-tier-limits", authenticateToken, requirePermission('update:settings'), (req, res, next) => 
  settingsController.updateFreeTierLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/food-scan-limits:
 *   get:
 *     summary: Get food scan limits configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the current food scan limits for free and paid users
 *     responses:
 *       200:
 *         description: Food scan limits retrieved successfully
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
 *                         freeUserLimit:
 *                           type: integer
 *                           description: Daily scan limit for free users
 *                         paidUserLimit:
 *                           type: integer
 *                           description: Daily scan limit for paid users
 *       401:
 *         description: Unauthorized
 */
router.get("/food-scan-limits", authenticateToken, (req, res, next) => 
  settingsController.getFoodScanLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/food-scan-limits:
 *   post:
 *     summary: Create food scan limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Create new food scan limits. Will fail if limits already exist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - freeUserLimit
 *               - paidUserLimit
 *             properties:
 *               freeUserLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5
 *                 description: Maximum number of food scans per day for free users
 *               paidUserLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 20
 *                 description: Maximum number of food scans per day for paid users
 *     responses:
 *       201:
 *         description: Food scan limits created successfully
 *       400:
 *         description: Bad request - validation error or limits already exist
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 */
router.post("/food-scan-limits", authenticateToken, requirePermission('create:settings'), (req, res, next) => 
  settingsController.createFoodScanLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/food-scan-limits:
 *   put:
 *     summary: Create or update food scan limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Upsert operation - creates limits if they don't exist, or updates if they do
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - freeUserLimit
 *               - paidUserLimit
 *             properties:
 *               freeUserLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *                 description: Maximum number of food scans per day for free users
 *               paidUserLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 30
 *                 description: Maximum number of food scans per day for paid users
 *     responses:
 *       200:
 *         description: Food scan limits updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 */
router.put("/food-scan-limits", authenticateToken, requirePermission('update:settings'), (req, res, next) => 
  settingsController.upsertFoodScanLimits(req, res, next)
);

/**
 * @swagger
 * /api/settings/food-scan-limits:
 *   patch:
 *     summary: Partially update food scan limits (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Update only specified limit fields. Limits must already exist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               freeUserLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 8
 *                 description: Maximum number of food scans per day for free users
 *               paidUserLimit:
 *                 type: integer
 *                 minimum: 0
 *                 example: 25
 *                 description: Maximum number of food scans per day for paid users
 *     responses:
 *       200:
 *         description: Food scan limits updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Food scan limits not found
 */
router.patch("/food-scan-limits", authenticateToken, requirePermission('update:settings'), (req, res, next) => 
  settingsController.updateFoodScanLimits(req, res, next)
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
  settingsController.getUserScanStatus(req, res, next)
);

export { router as settingsRoutes };

