import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateToken, requirePermission } from "../../../shared/middleware/auth";

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user's profile with profile data
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *                   example:
 *                     status: 200
 *                     success: true
 *                     message: Profile retrieved successfully
 *                     data:
 *                       id: "uuid-string"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john@example.com"
 *                       emailVerified: false
 *                       provider: "manual"
 *                       providerId: null
 *                       avatar: null
 *                       role: "customer"
 *                       tier: "free"
 *                       isActive: true
 *                       profileComplete: true
 *                       profileData:
 *                         id: "uuid-string"
 *                         userId: "uuid-string"
 *                         gender: "male"
 *                         birthday: "1990-01-15T00:00:00Z"
 *                         diagnosisDate: "2020-05-10T00:00:00Z"
 *                         weight: "70"
 *                         height: "175"
 *                         diabetesType: "type2"
 *                         createdAt: "2024-01-01T00:00:00Z"
 *                         updatedAt: "2024-01-01T00:00:00Z"
 *                       createdAt: "2024-01-01T00:00:00Z"
 *                       updatedAt: "2024-01-01T00:00:00Z"
 *             examples:
 *               customer:
 *                 summary: Customer user
 *                 value:
 *                   status: 200
 *                   success: true
 *                   message: Profile retrieved successfully
 *                   data:
 *                     id: "uuid-string"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john@example.com"
 *                     emailVerified: false
 *                     provider: "manual"
 *                     providerId: null
 *                     avatar: null
 *                     role: "customer"
 *                     tier: "free"
 *                     isActive: true
 *                     profileComplete: true
 *                     profileData:
 *                       id: "uuid-string"
 *                       userId: "uuid-string"
 *                       gender: "male"
 *                       birthday: "1990-01-15T00:00:00Z"
 *                       diagnosisDate: "2020-05-10T00:00:00Z"
 *                       weight: "70"
 *                       height: "175"
 *                       diabetesType: "type2"
 *                       createdAt: "2024-01-01T00:00:00Z"
 *                       updatedAt: "2024-01-01T00:00:00Z"
 *                     createdAt: "2024-01-01T00:00:00Z"
 *                     updatedAt: "2024-01-01T00:00:00Z"
 *               physician:
 *                 summary: Physician user
 *                 value:
 *                   status: 200
 *                   success: true
 *                   message: Profile retrieved successfully
 *                   data:
 *                     id: "uuid-string"
 *                     firstName: "Alice"
 *                     lastName: "Smith"
 *                     email: "alice@example.com"
 *                     emailVerified: true
 *                     provider: "manual"
 *                     providerId: null
 *                     avatar: null
 *                     role: "physician"
 *                     tier: "paid"
 *                     isActive: true
 *                     profileComplete: true
 *                     profileData:
 *                       id: "uuid-string"
 *                       userId: "uuid-string"
 *                       specialtyId: "uuid-string"
 *                       specialty: "Endocrinology"
 *                       practiceStartDate: "2010-05-01T00:00:00Z"
 *                       consultationFee: "100"
 *                       imageUrl: "https://example.com/physician.jpg"
 *                       createdAt: "2024-01-01T00:00:00Z"
 *                       updatedAt: "2024-01-01T00:00:00Z"
 *                     createdAt: "2024-01-01T00:00:00Z"
 *                     updatedAt: "2024-01-01T00:00:00Z"
 *               incomplete:
 *                 summary: Profile incomplete (profileData is null)
 *                 value:
 *                   status: 200
 *                   success: true
 *                   message: Profile retrieved successfully
 *                   data:
 *                     id: "uuid-string"
 *                     firstName: "Joe"
 *                     lastName: "Bloggs"
 *                     email: "joe@example.com"
 *                     emailVerified: false
 *                     provider: "manual"
 *                     providerId: null
 *                     avatar: null
 *                     role: "customer"
 *                     tier: "free"
 *                     isActive: true
 *                     profileComplete: false
 *                     profileData: null
 *                     createdAt: "2024-01-01T00:00:00Z"
 *                     updatedAt: "2024-01-01T00:00:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/profile", authenticateToken, requirePermission('read:own_profile'), (req, res ) => userController.getProfile(req, res ));


export { router as userRoutes };
