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
 *                             gender:
 *                               type: string
 *                             birthday:
 *                               type: string
 *                               format: date
 *                               description: Birthday in YYYY-MM-DD format, or send separate birthDay/birthMonth/birthYear fields
 *                             diagnosisDate:
 *                               type: string
 *                               format: date
 *                               description: Diagnosis date in YYYY-MM-DD format, or send separate diagnosisDay/diagnosisMonth/diagnosisYear fields
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
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "1990-06-15"
 *                 description: Birthday in YYYY-MM-DD format, or send separate birthDay/birthMonth/birthYear fields
 *               diagnosisDate:
 *                 type: string
 *                 format: date
 *                 example: "2020-03-01"
 *                 description: Diagnosis date in YYYY-MM-DD format, or send separate diagnosisDay/diagnosisMonth/diagnosisYear fields
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
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: Birthday in YYYY-MM-DD format, or send separate birthDay/birthMonth/birthYear fields
 *               diagnosisDate:
 *                 type: string
 *                 format: date
 *                 description: Diagnosis date in YYYY-MM-DD format, or send separate diagnosisDay/diagnosisMonth/diagnosisYear fields
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

