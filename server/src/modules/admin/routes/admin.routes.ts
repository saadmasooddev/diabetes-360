import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticateToken, requireAdmin } from "../../../shared/middleware/auth";

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

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
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [free, paid]
 *         description: Filter users by tier
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
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                             gender:
 *                               type: string
 *                             birthDay:
 *                               type: string
 *                             birthMonth:
 *                               type: string
 *                             birthYear:
 *                               type: string
 *                             diagnosisDay:
 *                               type: string
 *                             diagnosisMonth:
 *                               type: string
 *                             diagnosisYear:
 *                               type: string
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
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [customer, admin, physician]
 *                 default: customer
 *               tier:
 *                 type: string
 *                 enum: [free, paid]
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
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                   diabetesType:
 *                     type: string
 *                     enum: [type1, type2, gestational, prediabetes]
 *                     description: Required for customer role
 *                   birthDay:
 *                     type: string
 *                     description: Optional - defaults to '01' if not provided
 *                   birthMonth:
 *                     type: string
 *                     description: Optional - defaults to '01' if not provided
 *                   birthYear:
 *                     type: string
 *                     description: Optional - defaults to current year if not provided
 *                   diagnosisDay:
 *                     type: string
 *                     description: Optional - defaults to '01' if not provided
 *                   diagnosisMonth:
 *                     type: string
 *                     description: Optional - defaults to '01' if not provided
 *                   diagnosisYear:
 *                     type: string
 *                     description: Optional - defaults to current year if not provided
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
router.post("/users", (req, res, next) => adminController.createUser(req, res, next));

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
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [customer, admin, physician]
 *               tier:
 *                 type: string
 *                 enum: [free, paid]
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
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                   diabetesType:
 *                     type: string
 *                     enum: [type1, type2, gestational, prediabetes]
 *                   birthDay:
 *                     type: string
 *                   birthMonth:
 *                     type: string
 *                   birthYear:
 *                     type: string
 *                   diagnosisDay:
 *                     type: string
 *                   diagnosisMonth:
 *                     type: string
 *                   diagnosisYear:
 *                     type: string
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
router.put("/users/:id", (req, res, next) => adminController.updateUser(req, res ));

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
router.delete("/users/:id", (req, res, next) => adminController.deleteUser(req, res ));

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
router.patch("/users/:id/status", (req, res, next) => adminController.toggleUserStatus(req, res ));

export { router as adminRoutes };
