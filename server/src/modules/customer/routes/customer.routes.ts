import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authenticateToken } from "../../../shared/middleware/auth";

const router = Router();
const customerController = new CustomerController();

// All routes require authentication

router.use(authenticateToken);

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Get customer profile data
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer data retrieved successfully
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
 *                         customerData:
 *                           type: object
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
 */
router.get("/profile", (req, res, next) => 
  customerController.getCustomerData(req, res, next)
);

/**
 * @swagger
 * /api/customer/profile:
 *   post:
 *     summary: Complete customer profile
 *     tags: [Customer]
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
 *               - gender
 *               - birthDay
 *               - birthMonth
 *               - birthYear
 *               - diagnosisDay
 *               - diagnosisMonth
 *               - diagnosisYear
 *               - weight
 *               - height
 *               - diabetesType
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               birthDay:
 *                 type: string
 *                 example: "15"
 *               birthMonth:
 *                 type: string
 *                 example: "06"
 *               birthYear:
 *                 type: string
 *                 example: "1990"
 *               diagnosisDay:
 *                 type: string
 *                 example: "01"
 *               diagnosisMonth:
 *                 type: string
 *                 example: "03"
 *               diagnosisYear:
 *                 type: string
 *                 example: "2020"
 *               weight:
 *                 type: string
 *                 example: "70"
 *               height:
 *                 type: string
 *                 example: "175"
 *               diabetesType:
 *                 type: string
 *                 enum: [type1, type2, gestational, prediabetes]
 *     responses:
 *       200:
 *         description: Profile completed successfully
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
 *                         customerData:
 *                           type: object
 *       400:
 *         description: Invalid data or profile already completed
 */
router.post("/profile", (req, res, next) => 
  customerController.createCustomerData(req, res, next)
);

/**
 * @swagger
 * /api/customer/profile:
 *   put:
 *     summary: Update customer profile data
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               birthDay:
 *                 type: string
 *               birthMonth:
 *                 type: string
 *               birthYear:
 *                 type: string
 *               diagnosisDay:
 *                 type: string
 *               diagnosisMonth:
 *                 type: string
 *               diagnosisYear:
 *                 type: string
 *               weight:
 *                 type: string
 *               height:
 *                 type: string
 *               diabetesType:
 *                 type: string
 *                 enum: [type1, type2, gestational, prediabetes]
 *     responses:
 *       200:
 *         description: Customer data updated successfully
 */
router.put("/profile", (req, res, next) => 
  customerController.updateCustomerData(req, res, next)
);

export { router as customerRoutes };

