import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { authenticateToken, requirePermission } from "../../../shared/middleware/auth";

const router = Router();
const healthController = new HealthController();

const readOwnHealthMetrics = requirePermission('read:own_health_metrics');

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
 *             required:
 *               - userId
 *             properties:
 *               bloodSugar:
 *                 type: string
 *                 nullable: true
 *                 example: "120"
 *                 description: Blood sugar level in mg/dL
 *               steps:
 *                 type: integer
 *                 nullable: true
 *                 example: 5000
 *                 description: Number of steps walked
 *               waterIntake:
 *                 type: string
 *                 nullable: true
 *                 example: "2.5"
 *                 description: Water intake in liters
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
 *         description: Bad request - validation error or limit exceeded
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
router.post("/metrics/add", authenticateToken, requirePermission('create:own_health_metrics'), (req, res, next) => 
  healthController.addMetric(req, res, next)
);

/**
 * @swagger
 * /api/health/metrics/latest:
 *   get:
 *     summary: Get the latest health metric for the current user
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest metric retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthMetric'
 *                       nullable: true
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
router.get("/metrics/latest", authenticateToken, readOwnHealthMetrics, (req, res, next) => 
  healthController.getLatestMetric(req, res, next)
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
router.get("/metrics", authenticateToken, readOwnHealthMetrics, (req, res, next) => 
  healthController.getMetrics(req, res, next)
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
router.get("/metrics/chart", authenticateToken, readOwnHealthMetrics, (req, res, next) => 
  healthController.getChartData(req, res, next)
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
router.get("/metrics/today-count", authenticateToken, readOwnHealthMetrics, (req, res, next) => 
  healthController.getTodaysCount(req, res, next)
);

/**
 * @swagger
 * /api/health/metrics/statistics:
 *   get:
 *     summary: Get aggregated health statistics (daily, weekly, monthly averages)
 *     tags: [Health Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated statistics retrieved successfully
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
router.get("/metrics/statistics", authenticateToken, readOwnHealthMetrics, (req, res, next) => 
  healthController.getAggregatedStatistics(req, res, next)
);

export { router as healthRoutes };

