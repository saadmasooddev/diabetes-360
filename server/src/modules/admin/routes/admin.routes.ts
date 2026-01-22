import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import {
	authenticateToken,
	requirePermission,
} from "../../../shared/middleware/auth";
import { PERMISSIONS } from "@shared/schema";

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin permissions
router.use(authenticateToken);
router.use(requirePermission(PERMISSIONS.READ_ALL_USERS));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of users to skip
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, admin, physician]
 *         description: Filter users by role
 *       - in: query
 *         name: paymentType
 *         schema:
 *           type: string
 *           enum: [free, monthly, annual]
 *         description: Filter users by payment type
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
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
router.get("/users", (req, res) => adminController.getAllUsers(req, res));

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         customerData:
 *                           type: object
 *                           nullable: true
 *                           description: Included if user role is customer and customer data exists
 *                           properties:
 *                             id:
 *                               type: string
 *                             userId:
 *                               type: string
 *                             gender:
 *                               type: string
 *                             birthday:
 *                               type: string
 *                               format: date
 *                             diagnosisDate:
 *                               type: string
 *                               format: date
 *                             weight:
 *                               type: string
 *                             height:
 *                               type: string
 *                             diabetesType:
 *                               type: string
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/users/:id", (req, res) => adminController.getUserById(req, res));

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               role:
 *                 type: string
 *                 enum: [customer, admin, physician]
 *                 default: customer
 *               paymentType:
 *                 type: string
 *                 enum: [free, monthly, annual]
 *                 default: free
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               physicianData:
 *                 type: object
 *                 description: Required if role is physician
 *                 properties:
 *                   specialtyId:
 *                     type: string
 *                   practiceStartDate:
 *                     type: string
 *                     format: date-time
 *                   consultationFee:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     nullable: true
 *               customerData:
 *                 type: object
 *                 description: Optional for customer role. At least diabetesType is required.
 *                 properties:
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                   diabetesType:
 *                     type: string
 *                     enum: [type1, type2, gestational, prediabetes]
 *                     description: Required for customer role
 *                   birthday:
 *                     type: string
 *                     format: date
 *                     description: Birthday in YYYY-MM-DD format, or send separate birthDay/birthMonth/birthYear fields
 *                   diagnosisDate:
 *                     type: string
 *                     format: date
 *                     description: Diagnosis date in YYYY-MM-DD format, or send separate diagnosisDay/diagnosisMonth/diagnosisYear fields
 *                   weight:
 *                     type: string
 *                     description: Optional - defaults to '70' if not provided
 *                   height:
 *                     type: string
 *                     description: Optional - defaults to '170' if not provided
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         tokens:
 *                           $ref: '#/components/schemas/TokenPair'
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
 *       409:
 *         description: Conflict - user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
	"/users",
	requirePermission(PERMISSIONS.CREATE_USERS),
	(req, res, next) => adminController.createUser(req, res, next),
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 enum: [customer, admin, physician]
 *               paymentType:
 *                 type: string
 *                 enum: [free, monthly, annual]
 *               isActive:
 *                 type: boolean
 *               physicianData:
 *                 type: object
 *                 description: Optional - for updating physician data
 *                 properties:
 *                   specialtyId:
 *                     type: string
 *                   practiceStartDate:
 *                     type: string
 *                     format: date-time
 *                   consultationFee:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                     nullable: true
 *               customerData:
 *                 type: object
 *                 description: Optional - for updating customer data
 *                 properties:
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                   diabetesType:
 *                     type: string
 *                     enum: [type1, type2, gestational, prediabetes]
 *                   birthday:
 *                     type: string
 *                     format: date
 *                     description: Birthday in YYYY-MM-DD format, or send separate birthDay/birthMonth/birthYear fields
 *                   diagnosisDate:
 *                     type: string
 *                     format: date
 *                     description: Diagnosis date in YYYY-MM-DD format, or send separate diagnosisDay/diagnosisMonth/diagnosisYear fields
 *                   weight:
 *                     type: string
 *                   height:
 *                     type: string
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
	"/users/:id",
	requirePermission(PERMISSIONS.UPDATE_USERS),
	(req, res, next) => adminController.updateUser(req, res),
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
	"/users/:id",
	requirePermission(PERMISSIONS.DELETE_USERS),
	(req, res, next) => adminController.deleteUser(req, res),
);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Toggle user active status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
	"/users/:id/status",
	requirePermission(PERMISSIONS.UPDATE_USERS),
	(req, res, next) => adminController.toggleUserStatus(req, res),
);

export { router as adminRoutes };
