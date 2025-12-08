import { Router } from 'express';
import { FoodScannerController } from '../controllers/foodScanner.controller';
import { authenticateToken, requirePermission, requireRole } from '../../../shared/middleware/auth';
import { memoryUpload } from '../../../shared/config/multer.config';

const router = Router();
const foodScannerController = new FoodScannerController();

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
  (req, res) => foodScannerController.scanFood(req, res)
);

export { router as foodScannerRoutes };

