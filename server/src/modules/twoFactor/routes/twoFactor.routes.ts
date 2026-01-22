import { Router } from "express";
import { TwoFactorController } from "../controllers/twoFactor.controller";
import { authenticateToken } from "../../../shared/middleware/auth";

const router = Router();
const twoFactorController = new TwoFactorController();

/**
 * @swagger
 * /api/two-factor/status:
 *   get:
 *     summary: Get two-factor authentication status
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the current 2FA status (enabled/verified) for the authenticated user
 *     responses:
 *       200:
 *         description: 2FA status retrieved successfully
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
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *                         verified:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/status", authenticateToken, (req, res, next) =>
	twoFactorController.get2FAStatus(req, res),
);

/**
 * @swagger
 * /api/two-factor/setup:
 *   post:
 *     summary: Setup two-factor authentication
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Generates a new TOTP secret and QR code for setting up 2FA with an authenticator app
 *     responses:
 *       200:
 *         description: 2FA setup initiated successfully
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
 *                         secret:
 *                           type: string
 *                           example: "JBSWY3DPEHPK3PXP"
 *                           description: Base32 encoded TOTP secret
 *                         qrCodeUrl:
 *                           type: string
 *                           format: data-uri
 *                           example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *                           description: QR code as data URI for scanning with authenticator app
 *                         backupCodes:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["A1B2C3D4", "E5F6G7H8", ...]
 *                           description: One-time backup codes (save these securely)
 *       400:
 *         description: Bad request - 2FA already enabled
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
 */
router.post("/setup", authenticateToken, (req, res, next) =>
	twoFactorController.setup2FA(req, res),
);

/**
 * @swagger
 * /api/two-factor/verify:
 *   post:
 *     summary: Verify and enable two-factor authentication
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Verifies the TOTP code from the authenticator app and enables 2FA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *                 description: 6-digit TOTP code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
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
 *                         verified:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Bad request - validation error or 2FA already enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/verify", authenticateToken, (req, res, next) =>
	twoFactorController.verifyAndEnable2FA(req, res),
);

/**
 * @swagger
 * /api/two-factor/disable:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Disables 2FA for the authenticated user. Requires 2FA to be currently enabled.
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - 2FA not enabled
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
 */
router.post("/disable", authenticateToken, (req, res) =>
	twoFactorController.disable2FA(req, res),
);

/**
 * @swagger
 * /api/two-factor/regenerate-backup-codes:
 *   post:
 *     summary: Regenerate backup codes
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Generates new backup codes for 2FA. Previous backup codes will be invalidated.
 *     responses:
 *       200:
 *         description: Backup codes regenerated successfully
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
 *                         backupCodes:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["A1B2C3D4", "E5F6G7H8", ...]
 *                           description: New one-time backup codes (save these securely)
 *       400:
 *         description: Bad request - 2FA not enabled
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
 */
router.post("/regenerate-backup-codes", authenticateToken, (req, res) =>
	twoFactorController.regenerateBackupCodes(req, res),
);

export { router as twoFactorRoutes };
