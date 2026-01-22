import { Router } from "express";
import { FoodController } from "../controllers/food.controller";
import {
	authenticateToken,
	requirePermission,
} from "../../../shared/middleware/auth";
import { memoryUpload } from "../../../shared/config/multer.config";
import { PERMISSIONS, USER_ROLES } from "../../auth/models/user.schema";

const router = Router();
const foodController = new FoodController();

/**
 * @swagger
 * /api/food/scan:
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
	"/scan",
	authenticateToken,
	// requirePermission('scan:food'),
	memoryUpload.single("food_image"),
	(req, res) => foodController.scanFood(req, res),
);

/**
 * @swagger
 * /api/food/nutrition/requirements:
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
router.get("/daily-data", authenticateToken, (req, res) =>
	foodController.getPaidUserDailyData(req, res),
);

/**
 * @swagger
 * /api/food/nutrition/consumed:
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
	"/nutrition/consumed",
	authenticateToken,
	requirePermission("scan:food"),
	(req, res) => foodController.getConsumedNutrients(req, res),
);

/**
 * @swagger
 * /api/food/details:
 *   post:
 *     summary: Generate or fetch recipe details for a meal
 *     tags: [Food Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mealType
 *               - nutrition_info
 *             properties:
 *               name:
 *                 type: string
 *                 description: Meal name exactly as present in the meal plan
 *               mealType:
 *                 type: string
 *                 enum: [Breakfast, Lunch, Dinner]
 *                 description: Meal type to match against the meal plan
 *               nutrition_info:
 *                 type: object
 *                 properties:
 *                   carbs:
 *                     type: number
 *                   proteins:
 *                     type: number
 *                   calories:
 *                     type: number
 *     responses:
 *       200:
 *         description: Recipe generated or returned from cache
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
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         ingredients:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               main_ingredients:
 *                                 type: object
 *                                 properties:
 *                                   heading:
 *                                     type: string
 *                                   items:
 *                                     type: array
 *                                     items:
 *                                       type: string
 *                               sub_ingredients:
 *                                 type: object
 *                                 properties:
 *                                   heading:
 *                                     type: string
 *                                   items:
 *                                     type: array
 *                                     items:
 *                                       type: string
 *                         making_steps:
 *                           type: array
 *                           items:
 *                             type: string
 *       400:
 *         description: Meal not found or validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/details", authenticateToken, (req, res) =>
	foodController.generateRecipe(req, res),
);

/**
 * @swagger
 * /api/food/log-meal:
 *   post:
 *     summary: Log a meal after scanning (explicit user action)
 *     tags: [Food Scanner]
 *     security:
 *       - bearerAuth: []
 *     description: Logs a meal that the user explicitly chooses to log after scanning. This updates the consumed nutrients for the day. Only logged meals count towards daily calorie tracking.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foodName
 *               - carbs
 *               - sugars
 *               - fibres
 *               - proteins
 *               - fats
 *               - calories
 *             properties:
 *               foodName:
 *                 type: string
 *                 description: Name of the food item
 *                 example: "Grilled Chicken Salad"
 *               carbs:
 *                 type: number
 *                 minimum: 0
 *                 description: Carbohydrates in grams
 *                 example: 25.5
 *               sugars:
 *                 type: number
 *                 minimum: 0
 *                 description: Sugars in grams
 *                 example: 5.2
 *               fibres:
 *                 type: number
 *                 minimum: 0
 *                 description: Fibres in grams
 *                 example: 8.3
 *               proteins:
 *                 type: number
 *                 minimum: 0
 *                 description: Proteins in grams
 *                 example: 35.0
 *               fats:
 *                 type: number
 *                 minimum: 0
 *                 description: Fats in grams
 *                 example: 12.5
 *               calories:
 *                 type: number
 *                 minimum: 0
 *                 description: Total calories
 *                 example: 320
 *     responses:
 *       200:
 *         description: Meal logged successfully
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
 *                         userId:
 *                           type: string
 *                         mealDate:
 *                           type: string
 *                           format: date
 *                         foodName:
 *                           type: string
 *                         carbs:
 *                           type: string
 *                         sugars:
 *                           type: string
 *                         fibres:
 *                           type: string
 *                         proteins:
 *                           type: string
 *                         fats:
 *                           type: string
 *                         calories:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
	"/log-meal",
	authenticateToken,
	requirePermission(PERMISSIONS.SCAN_FOOD),
	(req, res) => foodController.logMeal(req, res),
);

export { router as foodRoutes };
