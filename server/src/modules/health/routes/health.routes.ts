import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import {
	authenticateToken,
	requireAnyPermission,
	requirePermission,
} from "../../../shared/middleware/auth";
import { imageMemoryUpload } from "../../../shared/config/multer.config";
import { PERMISSIONS, USER_ROLES } from "@shared/schema";

const router = Router();
const healthController = new HealthController();

const readOwnHealthMetrics = requireAnyPermission([
	PERMISSIONS.READ_OWN_HEALTH_METRICS,
]);

/**
 * @swagger
 * /api/health/metrics/latest:
 *   get:
 *     summary: Get the latest health metric and daily limits for the current user
 *     description: Returns the most recent health metric entry, the previous entry (for comparison), and the current free tier daily limits configuration. Both `current` and `previous` are partial HealthMetric objects that may contain any subset of health metric fields (bloodSugar, steps, waterIntake, heartRate).
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Latest metric and tier limits retrieved successfully
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
 *                         current:
 *                           type: object
 *                           description: The most recent health metric entry (partial HealthMetric)
 *                           nullable: true
 *                           properties:
 *                             id: { type: string, example: "uuid-string" }
 *                             userId: { type: string, example: "uuid-string" }
 *                             bloodSugar:
 *                               type: string
 *                               nullable: true
 *                               example: "120"
 *                               description: Blood sugar level in mg/dL
 *                             steps:
 *                               type: integer
 *                               nullable: true
 *                               example: 5000
 *                               description: Number of steps walked
 *                             waterIntake:
 *                               type: string
 *                               nullable: true
 *                               example: "2.5"
 *                               description: Water intake in liters
 *                             heartRate:
 *                               type: integer
 *                               nullable: true
 *                               example: 72
 *                               description: Heart rate in beats per minute (BPM). Only available for paid users.
 *                             recordedAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-01-15T10:30:00Z"
 *                         previous:
 *                           type: object
 *                           description: The previous health metric entry before the current one (partial HealthMetric)
 *                           nullable: true
 *                           properties:
 *                             id: { type: string, example: "uuid-string" }
 *                             userId: { type: string, example: "uuid-string" }
 *                             bloodSugar:
 *                               type: string
 *                               nullable: true
 *                               example: "115"
 *                               description: Blood sugar level in mg/dL
 *                             steps:
 *                               type: integer
 *                               nullable: true
 *                               example: 4500
 *                               description: Number of steps walked
 *                             waterIntake:
 *                               type: string
 *                               nullable: true
 *                               example: "2.0"
 *                               description: Water intake in liters
 *                             heartRate:
 *                               type: integer
 *                               nullable: true
 *                               example: 70
 *                               description: Heart rate in beats per minute (BPM). Only available for paid users.
 *                             recordedAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-01-14T10:30:00Z"
 *                         limits:
 *                           type: object
 *                           properties:
 *                             glucoseLimit:
 *                               type: integer
 *                               minimum: 0
 *                               example: 5
 *                               description: Maximum number of glucose logs per day for free tier users
 *                             stepsLimit:
 *                               type: integer
 *                               minimum: 0
 *                               example: 4
 *                               description: Maximum number of steps logs per day for free tier users
 *                             waterLimit:
 *                               type: integer
 *                               minimum: 0
 *                               example: 3
 *                               description: Maximum number of water intake logs per day for free tier users
 *       401:
 *         description: Unauthorized
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
router.get(
	"/metrics/latest",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res, next) => healthController.getLatestMetric(req, res),
);

router.post(
	"/daily-quick-logs",
	authenticateToken,
	requireAnyPermission([PERMISSIONS.CREATE_OWN_HEALTH_METRICS]),
	(req, res) => healthController.createDailyQuickLog(req, res),
);


/**
 * @swagger
 * /api/health/metrics/statistics:
 *   get:
 *     summary: Get aggregated health statistics (daily, weekly, monthly averages) and targets
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: total
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: If "true", returns total values instead of averages. Defaults to false.
 *         example: "false"
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Aggregated statistics and targets retrieved successfully
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
 *                         glucose:
 *                           type: object
 *                           properties:
 *                             daily:
 *                               type: number
 *                               example: 135
 *                               description: Daily average blood sugar in mg/dL
 *                             weekly:
 *                               type: number
 *                               example: 98
 *                               description: Weekly average blood sugar in mg/dL
 *                             monthly:
 *                               type: number
 *                               example: 106
 *                               description: Monthly average blood sugar in mg/dL
 *                         water:
 *                           type: object
 *                           properties:
 *                             daily:
 *                               type: number
 *                               example: 1.2
 *                               description: Daily average water intake in liters
 *                             weekly:
 *                               type: number
 *                               example: 0.8
 *                               description: Weekly average water intake in liters
 *                             monthly:
 *                               type: number
 *                               example: 2.0
 *                               description: Monthly average water intake in liters
 *                         steps:
 *                           type: object
 *                           properties:
 *                             daily:
 *                               type: number
 *                               example: 3000
 *                               description: Daily average steps
 *                             weekly:
 *                               type: number
 *                               example: 6600
 *                               description: Weekly average steps
 *                             monthly:
 *                               type: number
 *                               example: 8700
 *                               description: Monthly average steps
 *                         heartRate:
 *                           type: object
 *                           properties:
 *                             daily:
 *                               type: number
 *                               example: 72
 *                               description: Daily average heart rate in BPM
 *                             weekly:
 *                               type: number
 *                               example: 70
 *                               description: Weekly average heart rate in BPM
 *                             monthly:
 *                               type: number
 *                               example: 75
 *                               description: Monthly average heart rate in BPM
 *                         targets:
 *                           type: object
 *                           properties:
 *                             recommended:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   userId:
 *                                     type: string
 *                                     nullable: true
 *                                   metricType:
 *                                     type: string
 *                                     enum: [glucose, steps, water_intake, heart_rate]
 *                                   targetValue:
 *                                     type: string
 *                                     format: numeric
 *                               description: Admin recommended targets (userId is null)
 *                             user:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   userId:
 *                                     type: string
 *                                   metricType:
 *                                     type: string
 *                                     enum: [glucose, steps, water_intake, heart_rate]
 *                                   targetValue:
 *                                     type: string
 *                                     format: numeric
 *                               description: User-specific targets
 *       401:
 *         description: Unauthorized
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
router.get(
	"/metrics/statistics",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res, next) => healthController.getAggregatedStatistics(req, res, next),
);

/**
 * @swagger
 * /api/health/metrics/filtered:
 *   get:
 *     summary: Get filtered health metrics by date range and metric types
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *         description: JSON array string of metric types to filter. Can be passed as JSON string or single value. Valid values are blood_sugar, water_intake, steps, and heart_beat. If not provided, all types are returned.
 *         example: '["steps", "water_intake"]'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of records to return per metric type
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of records to skip per metric type
 *     responses:
 *       200:
 *         description: Filtered metrics retrieved successfully
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
 *                         bloodSugarRecords:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               userId:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               value:
 *                                 oneOf:
 *                                   - type: number
 *                                   - type: string
 *                                 example: "120"
 *                               recordedAt:
 *                                 type: string
 *                                 format: date-time
 *                           description: Blood sugar records (MertricRecord format)
 *                         waterIntakeRecords:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               userId:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               value:
 *                                 oneOf:
 *                                   - type: number
 *                                   - type: string
 *                                 example: "2.5"
 *                               recordedAt:
 *                                 type: string
 *                                 format: date-time
 *                           description: Water intake records (MertricRecord format)
 *                         stepsRecords:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               userId:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               value:
 *                                 oneOf:
 *                                   - type: number
 *                                   - type: string
 *                                 example: 5000
 *                               recordedAt:
 *                                 type: string
 *                                 format: date-time
 *                           description: Steps records (MertricRecord format)
 *                         heartBeatRecords:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               userId:
 *                                 type: string
 *                                 example: "uuid-string"
 *                               value:
 *                                 oneOf:
 *                                   - type: number
 *                                   - type: string
 *                                 example: 72
 *                               recordedAt:
 *                                 type: string
 *                                 format: date-time
 *                           description: Heart rate records (MertricRecord format)
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             bloodSugar:
 *                               type: object
 *                               properties:
 *                                 total:
 *                                   type: integer
 *                                   example: 150
 *                                 limit:
 *                                   type: integer
 *                                   example: 30
 *                                 offset:
 *                                   type: integer
 *                                   example: 0
 *                             waterIntake:
 *                               type: object
 *                               properties:
 *                                 total:
 *                                   type: integer
 *                                   example: 120
 *                                 limit:
 *                                   type: integer
 *                                   example: 30
 *                                 offset:
 *                                   type: integer
 *                                   example: 0
 *                             steps:
 *                               type: object
 *                               properties:
 *                                 total:
 *                                   type: integer
 *                                   example: 200
 *                                 limit:
 *                                   type: integer
 *                                   example: 30
 *                                 offset:
 *                                   type: integer
 *                                   example: 0
 *                             heartBeat:
 *                               type: object
 *                               properties:
 *                                 total:
 *                                   type: integer
 *                                   example: 80
 *                                 limit:
 *                                   type: integer
 *                                   example: 30
 *                                 offset:
 *                                   type: integer
 *                                   example: 0
 *       400:
 *         description: Bad request - invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
	"/metrics/filtered",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res, next) => healthController.getFilteredMetrics(req, res, next),
);

/**
 * @swagger
 * /api/health/exercises/add/batch:
 *   post:
 *     summary: Log multiple exercises at once (including steps and activities)
 *     tags: [Health Exercises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exercises
 *             properties:
 *               healthMetrics:
 *                 type: object
 *                 nullable: true
 *                 description: Optional health metrics to log alongside exercises. If provided and valid, a health metric entry will be created.
 *                 properties:
 *                   bloodSugar:
 *                     type: number
 *                     nullable: true
 *                     example: 120
 *                     description: Blood sugar level in mg/dL
 *                   waterIntake:
 *                     type: number
 *                     nullable: true
 *                     example: 2.5
 *                     description: Water intake in liters
 *                   heartRate:
 *                     type: integer
 *                     nullable: true
 *                     example: 72
 *                     description: Heart rate in beats per minute (BPM). Only available for paid users.
 *                   recordedAt:
 *                     type: string
 *                     format: date-time
 *                     description: timestamp for the health metric
 *                     example: "2024-01-15T10:30:00Z"
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - exerciseType
 *                     - calories
 *                     - activityType
 *                   properties:
 *                     exerciseType:
 *                       type: string
 *                       example: "walking"
 *                       description: Type of exercise or activity
 *                     calories:
 *                       type: integer
 *                       minimum: 0
 *                       example: 150
 *                       description: Calories burned
 *                     activityType:
 *                       type: string
 *                       example: "walking"
 *                       description: Type of activity (walking, yoga, etc.)
 *                     steps:
 *                       type: number
 *                       nullable: true
 *                       example: 5000
 *                       description: Number of steps (optional, for walking activities)
 *                     pace:
 *                       type: string
 *                       nullable: true
 *                       example: "moderate"
 *                     sets:
 *                       type: string
 *                       nullable: true
 *                       example: "3"
 *                     weight:
 *                       type: string
 *                       nullable: true
 *                       example: "10kg"
 *                     muscle:
 *                       type: string
 *                       nullable: true
 *                       example: "legs"
 *                     duration:
 *                       type: string
 *                       nullable: true
 *                       example: "30 minutes"
 *                     repitition:
 *                       type: string
 *                       nullable: true
 *                       example: "10"
 *                     recordedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Optional timestamp, defaults to now
 *                 example: [{"exerciseType": "walking", "calories": 150, "activityType": "walking", "steps": 5000}, {"exerciseType": "yoga", "calories": 100, "activityType": "yoga", "duration": "30 minutes"}]
 *     responses:
 *       200:
 *         description: Exercises logged successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
	"/exercises/add/batch",
	authenticateToken,
	requireAnyPermission([PERMISSIONS.CREATE_OWN_HEALTH_METRICS]),
	(req, res) => healthController.addExerciseLogsBatch(req, res),
);

/**
 * @swagger
 * /api/health/exercises/strength-progress:
 *   get:
 *     summary: Get strength training progress logs and percentage improvement
 *     tags: [Health Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Strength progress retrieved successfully
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
 *                         logs:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                                 example: "2024-01-15"
 *                               total:
 *                                 type: integer
 *                                 example: 150
 *                                 description: Total exercises for the day
 *                               pushups:
 *                                 type: integer
 *                                 example: 50
 *                               squats:
 *                                 type: integer
 *                                 example: 30
 *                               chinups:
 *                                 type: integer
 *                                 example: 20
 *                               situps:
 *                                 type: integer
 *                                 example: 50
 *                         percentageImprovement:
 *                           type: integer
 *                           example: 25
 *                           description: Percentage improvement comparing first period with last period
 *       400:
 *         description: Bad request - invalid date parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
	"/exercises/strength-progress",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res) => healthController.getStrengthProgress(req, res),
);

/**
 * @swagger
 * /api/health/targets/recommended:
 *   get:
 *     summary: Get admin recommended targets for all metric types
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended targets retrieved successfully
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                             nullable: true
 *                           metricType:
 *                             type: string
 *                             enum: [glucose, steps, water_intake, heart_rate]
 *                           targetValue:
 *                             type: string
 *                             format: numeric
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/targets/recommended", authenticateToken, (req, res) =>
	healthController.getRecommendedTargets(req, res),
);

/**
 * @swagger
 * /api/health/targets:
 *   get:
 *     summary: Get both recommended and user-specific targets
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Targets retrieved successfully
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
 *                         recommended:
 *                           type: array
 *                           items:
 *                             type: object
 *                         user:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/targets", authenticateToken, readOwnHealthMetrics, (req, res) =>
	healthController.getTargetsForUser(req, res),
);

/**
 * @swagger
 * /api/health/targets/user/batch:
 *   post:
 *     summary: Create or update multiple user-specific targets
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targets
 *             properties:
 *               targets:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - metricType
 *                     - targetValue
 *                   properties:
 *                     metricType:
 *                       type: string
 *                       enum: [glucose, steps, water_intake, heart_rate]
 *                     targetValue:
 *                       type: number
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: User targets updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
	"/targets/user/batch",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res) => healthController.upsertUserTargetsBatch(req, res),
);
/**
 * @swagger
 * /api/health/targets/user/{metricType}:
 *   delete:
 *     summary: Delete user-specific target
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [glucose, steps, water_intake, heart_rate]
 *     responses:
 *       200:
 *         description: User target deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
	"/targets/user/:metricType",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res) => healthController.deleteUserTarget(req, res),
);

/**
 * @swagger
 * /api/health/targets/recommended/batch:
 *   post:
 *     summary: Create or update multiple admin recommended targets (admin only)
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targets
 *             properties:
 *               targets:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - metricType
 *                     - targetValue
 *                   properties:
 *                     metricType:
 *                       type: string
 *                       enum: [glucose, steps, water_intake, heart_rate]
 *                     targetValue:
 *                       type: number
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Recommended targets updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
router.post(
	"/targets/recommended/batch",
	authenticateToken,
	requireAnyPermission([PERMISSIONS.WRITE_HEALTH_TARGETS]),
	(req, res) => healthController.upsertRecommendedTargetsBatch(req, res),
);

/**
 * @swagger
 * /api/health/targets/user/batch:
 *   post:
 *     summary: Create or update multiple user-specific targets
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targets
 *             properties:
 *               targets:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - metricType
 *                     - targetValue
 *                   properties:
 *                     metricType:
 *                       type: string
 *                       enum: [glucose, steps, water_intake, heart_rate]
 *                     targetValue:
 *                       type: number
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: User targets updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
	"/targets/user/batch",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res) => healthController.upsertUserTargetsBatch(req, res),
);

/**
 * @swagger
 * /api/health/insights:
 *   get:
 *     summary: Get AI-generated health insights and recommendations
 *     description: Returns personalized health insights, overall health summary, and actionable tips. This endpoint is rate-limited to 3 requests per day per user. Results are cached for 8 hours.
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in ISO 8601 format (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Health insights retrieved successfully
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
 *                         insights:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "glucose"
 *                                 description: Metric name (glucose, water, steps, heart_rate)
 *                               insight:
 *                                 type: string
 *                                 example: "Blood sugar averaging 120 mg/dL daily, slightly above target but showing weekly improvement."
 *                         overallHealthSummary:
 *                           type: string
 *                           example: "You're doing excellent with water intake and maintaining a healthy heart rate..."
 *                         whatToDoNext:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Diet Tip"
 *                               tip:
 *                                 type: string
 *                                 example: "Eat smaller meals every three hours to stabilize blood sugar closer to target."
 *       400:
 *         description: Bad request - rate limit exceeded, customer data not found, or AI service error
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
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
	"/insights",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res, next) => healthController.getHealthInsights(req, res, next),
);

/**
 * @swagger
 * /api/health/exercises/calories-by-activity:
 *   get:
 *     summary: Get calories burned grouped by activity type for a date range
 *     description: Returns total calories for each activity type (cardio, strength_training, stretching) and chart data with date/time breakdown. If the date range is today only, shows time-based data.
 *     tags: [Health Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in ISO 8601 format (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Calories data retrieved successfully
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
 *                         totals:
 *                           type: object
 *                           properties:
 *                             cardio:
 *                               type: integer
 *                               example: 1500
 *                               description: Total calories from cardio activities
 *                             strength_training:
 *                               type: integer
 *                               example: 800
 *                               description: Total calories from strength training activities
 *                             stretching:
 *                               type: integer
 *                               example: 200
 *                               description: Total calories from stretching activities
 *                             total:
 *                               type: integer
 *                               example: 2500
 *                               description: Total calories from all activities
 *                         chartData:
 *                           type: object
 *                           properties:
 *                             cardio:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                     format: date
 *                                     example: "2024-01-15"
 *                                   time:
 *                                     type: string
 *                                     nullable: true
 *                                     example: "14:30"
 *                                     description: Time in HH:MM format (only present if date range is today)
 *                                   calories:
 *                                     type: integer
 *                                     example: 150
 *                                   recordedAt:
 *                                     type: string
 *                                     format: date-time
 *                                     example: "2024-01-15T14:30:00Z"
 *                             strength_training:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                     format: date
 *                                   time:
 *                                     type: string
 *                                     nullable: true
 *                                   calories:
 *                                     type: integer
 *                                   recordedAt:
 *                                     type: string
 *                                     format: date-time
 *                             stretching:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                     format: date
 *                                   time:
 *                                     type: string
 *                                     nullable: true
 *                                   calories:
 *                                     type: integer
 *                                   recordedAt:
 *                                     type: string
 *                                     format: date-time
 *       400:
 *         description: Bad request - invalid date parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
	"/exercises/calories-by-activity",
	authenticateToken,
	readOwnHealthMetrics,
	(req, res) => healthController.getCaloriesByActivityType(req, res),
);

/**
 * @swagger
 * /api/health/metrics/upload-glucose-image:
 *   post:
 *     summary: Upload glucose meter reading image for AI analysis
 *     description: Uploads an image of a glucose meter reading and uses AI to extract the blood sugar reading. Only available for customer users.
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file of glucose meter reading (JPEG, PNG, GIF, or WebP)
 *     responses:
 *       200:
 *         description: Glucose reading extracted successfully
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
 *                         blood_sugar_reading:
 *                           type: string
 *                           example: "122"
 *                           description: Extracted blood sugar reading in mg/dL
 *       400:
 *         description: Bad request - invalid image or processing error
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
 *         description: Forbidden - only customer users can upload glucose images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
	"/metrics/upload-glucose-image",
	authenticateToken,
	requirePermission(PERMISSIONS.SCAN_FOOD),
	imageMemoryUpload.single("image"),
	(req, res) => healthController.uploadGlucoseMeterImage(req, res),
);

export { router as healthRoutes };
