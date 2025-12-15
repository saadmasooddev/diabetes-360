import { Router } from 'express';
import { FoodController } from '../controllers/food.controller';
import { authenticateToken, requirePermission, requireRole } from '../../../shared/middleware/auth';
import { memoryUpload } from '../../../shared/config/multer.config';

const router = Router();
const foodController= new FoodController();

/**
 * @swagger
 * /api/food-scanner/scan:
 *   post:
 *     summary: Scan a food image using AI
 *     tags: [Food Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - food_image
 *             properties:
 *               food_image:
 *                 type: string
 *                 format: binary
 *                 description: Image file of the food to scan
 *     responses:
 *       200:
 *         description: Food scanned successfully
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
 *                         foodName:
 *                           type: string
 *                         foodCategory:
 *                           type: string
 *                         foodImage:
 *                           type: string
 *                         breakdown:
 *                           type: object
 *                         nutritionalHighlight:
 *                           type: object
 *                         can_scan_food:
 *                           type: boolean
 *                           description: Whether the user can scan more food today
 *                         remaining_scans:
 *                           type: integer
 *                           description: Number of remaining scans for today
 *       400:
 *         description: Bad request - invalid image or processing error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - daily scan limit reached
 */
router.post(
  '/scan',
  authenticateToken,
  requirePermission('scan:food'),
  memoryUpload.single('food_image'),
  (req, res) => foodController.scanFood(req, res)
);

/**
 * @swagger
 * /api/food-scanner/nutrition/requirements:
 *   get:
 *     summary: Get daily nutrition requirements for the user
 *     tags: [Food Scanner]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves daily nutrient intake recommendations. If recommendations exist for today, returns from database. Otherwise, calls AI API to generate new recommendations based on user profile and blood sugar history.
 *     responses:
 *       200:
 *         description: Nutrition requirements retrieved successfully
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
 *                         carbs:
 *                           type: number
 *                           description: Recommended carbs (total - sugars - fibres) in grams
 *                         sugars:
 *                           type: number
 *                           description: Recommended sugars in grams
 *                         fibres:
 *                           type: number
 *                           description: Recommended fibres in grams
 *                         proteins:
 *                           type: number
 *                           description: Recommended proteins in grams
 *                         fats:
 *                           type: number
 *                           description: Recommended fats in grams
 *                         calories:
 *                           type: number
 *                           description: Recommended calories
 *                         foodSuggestions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Suggested foods for the day
 *       400:
 *         description: Bad request - user profile data not found or AI service error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/daily-data',
  authenticateToken,
  (req, res) => foodController.getPaidUserDailyData(req, res)
);

/**
 * @swagger
 * /api/food-scanner/nutrition/consumed:
 *   get:
 *     summary: Get consumed nutrients for today
 *     tags: [Food Scanner]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves the total nutrients consumed by the user today from all food scans.
 *     responses:
 *       200:
 *         description: Consumed nutrients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         carbs:
 *                           type: number
 *                           description: Total carbs consumed today in grams
 *                         sugars:
 *                           type: number
 *                           description: Total sugars consumed today in grams
 *                         fibres:
 *                           type: number
 *                           description: Total fibres consumed today in grams
 *                         proteins:
 *                           type: number
 *                           description: Total proteins consumed today in grams
 *                         fats:
 *                           type: number
 *                           description: Total fats consumed today in grams
 *                         calories:
 *                           type: number
 *                           description: Total calories consumed today
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/nutrition/consumed',
  authenticateToken,
  requirePermission('scan:food'),
  (req, res) => foodController.getConsumedNutrients(req, res)
);



export { router as foodRoutes };

