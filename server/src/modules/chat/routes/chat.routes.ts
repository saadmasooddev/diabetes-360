import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import {
	authenticateToken,
	requireAnyPermission,
} from "../../../shared/middleware/auth";
import { PERMISSIONS } from "../../auth/models/user.schema";

const router = Router();
const chatController = new ChatController();

/**
 * @swagger
 * /api/chat:
 *   get:
 *     summary: Get DiaBot chat messages for a date
 *     tags: [Chat / DiaBot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-02-03"
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Chat messages for the day
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
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               recordedAt:
 *                                 type: string
 *                                 format: date-time
 *                               chatDate:
 *                                 type: string
 *                                 format: date
 *                               userId:
 *                                 type: string
 *                               role:
 *                                 type: string
 *                                 enum: [user, assistant]
 *                               message:
 *                                 type: string
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - USE_DIABOT permission required
 */
router.get(
	"/",
	authenticateToken,
	requireAnyPermission([PERMISSIONS.USE_DIABOT]),
	(req, res) => chatController.getChatByDate(req as any, res),
);

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message to DiaBot and receive AI response
 *     tags: [Chat / DiaBot]
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
 *               - message
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-02-03"
 *                 description: Date in YYYY-MM-DD format
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 description: User message to send to the chatbot
 *     responses:
 *       200:
 *         description: AI assistant response
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
 *                         assistantMessage:
 *                           type: string
 *       400:
 *         description: Invalid date or empty message
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - USE_DIABOT permission required
 */
router.post(
	"/",
	authenticateToken,
	requireAnyPermission([PERMISSIONS.USE_DIABOT]),
	(req, res) => chatController.sendMessage(req as any, res),
);

export { router as chatRoutes };
