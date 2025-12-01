import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import {
  authenticateToken,
  requirePermission,
} from "../../../shared/middleware/auth";

const router = Router();
const healthController = new HealthController();

const readOwnHealthMetrics = requirePermission("read:own_health_metrics");

/**
 * @swagger
 * /api/health/metrics/add:
 *   post:
 *     summary: Add a new health metric entry
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: userId is automatically extracted from the authenticated user's token
 *             properties:
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00Z"
 *                 description: The date and time the metric was recorded
 *               bloodSugar:
 *                 type: number
 *                 nullable: true
 *                 example: 120
 *                 description: Blood sugar level in mg/dL
 *               steps:
 *                 type: integer
 *                 nullable: true
 *                 example: 5000
 *                 description: Number of steps walked
 *               waterIntake:
 *                 type: number
 *                 nullable: true
 *                 example: 2.5
 *                 description: Water intake in liters
 *               heartRate:
 *                 type: integer
 *                 nullable: true
 *                 example: 72
 *                 description: Heart rate in beats per minute (BPM). Only available for paid users.
 *     responses:
 *       200:
 *         description: Metric added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthMetric'
 *       400:
 *         description: Bad request - validation error, limit exceeded, or heart rate feature requires paid tier
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
router.post(
  "/metrics/add",
  authenticateToken,
  requirePermission("create:own_health_metrics"),
  (req, res) => healthController.addMetric(req, res)
);

/**
 * @swagger
 * /api/health/metrics/latest:
 *   get:
 *     summary: Get the latest health metric and daily limits for the current user
 *     description: Returns the most recent health metric entry, the previous entry (for comparison), and the current free tier daily limits configuration. Both `current` and `previous` are partial HealthMetric objects that may contain any subset of health metric fields (bloodSugar, steps, waterIntake, heartRate).
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
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
  (req, res, next) => healthController.getLatestMetric(req, res, next)
);

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Get paginated health metrics for the current user
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of metrics to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of metrics to skip
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
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
 *                         $ref: '#/components/schemas/HealthMetric'
 *                       description: Array of health metrics, empty array returned on error
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
router.get("/metrics", authenticateToken, readOwnHealthMetrics, (req, res) =>
  healthController.getMetrics(req, res)
);

/**
 * @swagger
 * /api/health/metrics/chart:
 *   get:
 *     summary: Get health metrics for chart visualization
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *           minimum: 1
 *           maximum: 30
 *         description: Number of days of data to retrieve
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
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
 *                         $ref: '#/components/schemas/HealthMetric'
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
  "/metrics/chart",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getChartData(req, res)
);

/**
 * @swagger
 * /api/health/metrics/today-count:
 *   get:
 *     summary: Get today's metric count(s) for the current user
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metricType
 *         schema:
 *           type: string
 *           enum: [glucose, steps, water]
 *         description: Optional - Get count for specific metric type. If omitted, returns counts for all types.
 *     responses:
 *       200:
 *         description: Today's count(s) retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       oneOf:
 *                         - type: object
 *                           properties:
 *                             count:
 *                               type: integer
 *                               example: 2
 *                           description: When metricType query param is provided
 *                         - type: object
 *                           properties:
 *                             glucose:
 *                               type: integer
 *                               example: 2
 *                             steps:
 *                               type: integer
 *                               example: 1
 *                             water:
 *                               type: integer
 *                               example: 2
 *                           description: When metricType query param is omitted
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
  "/metrics/today-count",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getTodaysCount(req, res)
);

/**
 * @swagger
 * /api/health/metrics/statistics:
 *   get:
 *     summary: Get aggregated health statistics (daily, weekly, monthly averages) and targets
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
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
  (req, res, next) => healthController.getAggregatedStatistics(req, res, next)
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
  (req, res, next) => healthController.getFilteredMetrics(req, res, next)
);

/**
 * @swagger
 * /api/health/activities/add:
 *   post:
 *     summary: Log a time-based activity (walking or yoga)
 *     tags: [Health Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: userId is automatically extracted from the authenticated user's token
 *             required:
 *               - activityType
 *             properties:
 *               activityType:
 *                 type: string
 *                 enum: [walking, yoga]
 *                 example: "walking"
 *                 description: Type of activity
 *               hours:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 example: 1
 *                 description: Hours spent (will be converted to minutes)
 *               minutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *                 example: 30
 *                 description: Minutes spent
 *     responses:
 *       200:
 *         description: Activity logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ActivityLog'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  "/activities/add",
  authenticateToken,
  requirePermission("create:own_health_metrics"),
  (req, res) => healthController.addActivityLog(req, res)
);

/**
 * @swagger
 * /api/health/activities:
 *   get:
 *     summary: Get activity logs for the current user
 *     tags: [Health Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [walking, yoga]
 *         description: Filter by activity type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/activities",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getActivityLogs(req, res)
);

/**
 * @swagger
 * /api/health/activities/today:
 *   get:
 *     summary: Get today's activity logs
 *     tags: [Health Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [walking, yoga]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: Today's activity logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/activities/today",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getTodayActivityLogs(req, res)
);

/**
 * @swagger
 * /api/health/activities/today/total:
 *   get:
 *     summary: Get total activity minutes for today
 *     tags: [Health Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [walking, yoga]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: Total activity minutes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/activities/today/total",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getTotalActivityMinutesToday(req, res)
);


/**
 * @swagger
 * /api/health/exercises/add/batch:
 *   post:
 *     summary: Log multiple exercises at once
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
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - exerciseType
 *                     - count
 *                   properties:
 *                     exerciseType:
 *                       type: string
 *                       enum: [pushups, squats, chinups, situps]
 *                     count:
 *                       type: integer
 *                       minimum: 0
 *                 example: [{"exerciseType": "pushups", "count": 20}, {"exerciseType": "squats", "count": 15}]
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
  requirePermission("create:own_health_metrics"),
  (req, res) => healthController.addExerciseLogsBatch(req, res)
);

/**
 * @swagger
 * /api/health/exercises:
 *   get:
 *     summary: Get exercise logs for the current user
 *     tags: [Health Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exerciseType
 *         schema:
 *           type: string
 *           enum: [pushups, squats, chinups, situps]
 *         description: Filter by exercise type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Exercise logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/exercises",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getExerciseLogs(req, res)
);

/**
 * @swagger
 * /api/health/exercises/today:
 *   get:
 *     summary: Get today's exercise logs
 *     tags: [Health Exercises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's exercise logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/exercises/today",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getTodayExerciseLogs(req, res)
);

/**
 * @swagger
 * /api/health/exercises/today/totals:
 *   get:
 *     summary: Get today's exercise totals by type
 *     tags: [Health Exercises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's exercise totals retrieved successfully
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
 *                         pushups:
 *                           type: integer
 *                           example: 20
 *                         squats:
 *                           type: integer
 *                           example: 15
 *                         chinups:
 *                           type: integer
 *                           example: 7
 *                         situps:
 *                           type: integer
 *                           example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/exercises/today/totals",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getTodayExerciseTotals(req, res)
);

/**
 * @swagger
 * /api/health/exercises/strength-progress:
 *   get:
 *     summary: Get strength training progress percentage
 *     tags: [Health Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to calculate progress over
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
 *                         percentage:
 *                           type: integer
 *                           example: 64
 *                           description: Progress percentage (0-100)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/exercises/strength-progress",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getStrengthProgress(req, res)
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
router.get(
  "/targets/recommended",
  authenticateToken,
  (req, res) => healthController.getRecommendedTargets(req, res)
);

/**
 * @swagger
 * /api/health/targets/user:
 *   get:
 *     summary: Get user-specific targets for all metric types
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User targets retrieved successfully
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
router.get(
  "/targets/user",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getUserTargets(req, res)
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
router.get(
  "/targets",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.getTargetsForUser(req, res)
);

/**
 * @swagger
 * /api/health/targets/recommended:
 *   post:
 *     summary: Create or update admin recommended target (admin only)
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
 *               - metricType
 *               - targetValue
 *             properties:
 *               metricType:
 *                 type: string
 *                 enum: [glucose, steps, water_intake, heart_rate]
 *               targetValue:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Recommended target updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
router.post(
  "/targets/recommended",
  authenticateToken,
  requirePermission("write:health_targets"),
  (req, res) => healthController.upsertRecommendedTarget(req, res)
);

/**
 * @swagger
 * /api/health/targets/user:
 *   post:
 *     summary: Create or update user-specific target
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
 *               - metricType
 *               - targetValue
 *             properties:
 *               metricType:
 *                 type: string
 *                 enum: [glucose, steps, water_intake, heart_rate]
 *               targetValue:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: User target updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/targets/user",
  authenticateToken,
  readOwnHealthMetrics,
  (req, res) => healthController.upsertUserTarget(req, res)
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
  (req, res) => healthController.deleteUserTarget(req, res)
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
  requirePermission("write:health_targets"),
  (req, res) => healthController.upsertRecommendedTargetsBatch(req, res)
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
  (req, res) => healthController.upsertUserTargetsBatch(req, res)
);

export { router as healthRoutes };
