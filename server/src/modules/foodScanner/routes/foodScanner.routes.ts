import { Router } from 'express';
import { FoodScannerController } from '../controllers/foodScanner.controller';
import { authenticateToken } from '../../../shared/middleware/auth';
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
 *       400:
 *         description: Bad request - invalid image or processing error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/scan',
  authenticateToken,
  memoryUpload.single('food_image'),
  (req, res) => foodScannerController.scanFood(req, res)
);

export { router as foodScannerRoutes };

