import { Router } from "express";
import { PhysicianController } from "../controllers/physician.controller";
import { authenticateToken, requireAdmin } from "../../../shared/middleware/auth";
import { createMulterConfig } from "../../../shared/config/multer.config";

const router = Router();
const physicianController = new PhysicianController();

const uploadPhysicianImage = createMulterConfig({
  destination: 'public/uploads/physicians',
  fieldName: 'image',
});

/**
 * @swagger
 * /api/physician/specialties:
 *   get:
 *     summary: Get all active specialties for consultation
 *     tags: [Consultation]
 *     responses:
 *       200:
 *         description: Specialties retrieved successfully
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
 *                         specialties:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               specialty:
 *                                 type: string
 *                               icon:
 *                                 type: string
 */
router.get("/specialties", (req, res, next) => physicianController.getSpecialtiesForConsultation(req, res, next));

/**
 * @swagger
 * /api/physician/specialties/{specialtyId}/physicians:
 *   get:
 *     summary: Get physicians by specialty for consultation
 *     tags: [Consultation]
 *     parameters:
 *       - in: path
 *         name: specialtyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Specialty ID
 *     responses:
 *       200:
 *         description: Physicians retrieved successfully
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
 *                         physicians:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               fullName:
 *                                 type: string
 *                               specialty:
 *                                 type: string
 *                               experience:
 *                                 type: string
 *                               rating:
 *                                 type: number
 *                               consultationFee:
 *                                 type: string
 *                               imageUrl:
 *                                 type: string
 */
router.get("/specialties/:specialtyId/physicians", (req, res, next) => 
  physicianController.getPhysiciansBySpecialty(req, res, next)
);

/**
 * @swagger
 * /api/physician/ratings/{physicianId}:
 *   get:
 *     summary: Get physician rating
 *     tags: [Consultation]
 *     parameters:
 *       - in: path
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Physician ID
 *     responses:
 *       200:
 *         description: Rating retrieved successfully
 */
router.get("/ratings/:physicianId", (req, res, next) => 
  physicianController.getPhysicianRating(req, res, next)
);

// Authenticated rating creation
router.post("/ratings", authenticateToken, (req, res, next) => 
  physicianController.createRating(req, res, next)
);

// Admin routes for specialty management
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/physician/admin/specialties:
 *   get:
 *     summary: Get all specialties (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Specialties retrieved successfully
 */
router.get("/admin/specialties", (req, res, next) => 
  physicianController.getAllSpecialties(req, res, next)
);

/**
 * @swagger
 * /api/physician/admin/specialties/{id}:
 *   get:
 *     summary: Get specialty by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Specialty ID
 *     responses:
 *       200:
 *         description: Specialty retrieved successfully
 */
router.get("/admin/specialties/:id", (req, res, next) => 
  physicianController.getSpecialtyById(req, res, next)
);

/**
 * @swagger
 * /api/physician/admin/specialties:
 *   post:
 *     summary: Create a new specialty (Admin only)
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Diabetologist
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Specialty created successfully
 */
router.post("/admin/specialties", (req, res, next) => 
  physicianController.createSpecialty(req, res, next)
);

/**
 * @swagger
 * /api/physician/admin/specialties/{id}:
 *   put:
 *     summary: Update specialty (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Specialty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Specialty updated successfully
 */
router.put("/admin/specialties/:id", (req, res, next) => 
  physicianController.updateSpecialty(req, res, next)
);

/**
 * @swagger
 * /api/physician/admin/specialties/{id}:
 *   delete:
 *     summary: Delete specialty (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Specialty ID
 *     responses:
 *       200:
 *         description: Specialty deleted successfully
 */
router.delete("/admin/specialties/:id", (req, res, next) => 
  physicianController.deleteSpecialty(req, res, next)
);

// Physician data routes (for admin when creating/editing users)
/**
 * @swagger
 * /api/physician/admin/physician-data/{userId}:
 *   get:
 *     summary: Get physician data by user ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Physician data retrieved successfully
 */
router.get("/admin/physician-data/:userId", (req, res, next) => 
  physicianController.getPhysicianData(req, res, next)
);

/**
 * @swagger
 * /api/physician/admin/physician-data:
 *   post:
 *     summary: Create physician data (Admin only)
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
 *               - userId
 *               - specialtyId
 *               - practiceStartDate
 *               - consultationFee
 *             properties:
 *               userId:
 *                 type: string
 *               specialtyId:
 *                 type: string
 *               practiceStartDate:
 *                 type: string
 *                 format: date-time
 *               consultationFee:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Physician data created successfully
 */
router.post("/admin/physician-data", (req, res, next) => 
  physicianController.createPhysicianData(req, res, next)
);

/**
 * @swagger
 * /api/physician/admin/physician-data/{userId}:
 *   put:
 *     summary: Update physician data (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               specialtyId:
 *                 type: string
 *               practiceStartDate:
 *                 type: string
 *                 format: date-time
 *               consultationFee:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Physician data updated successfully
 */
router.put("/admin/physician-data/:userId", (req, res, next) => 
  physicianController.updatePhysicianData(req, res, next)
);

/**
 * @swagger
 * /api/physician/admin/upload-image:
 *   post:
 *     summary: Upload physician image (Admin only)
 *     tags: [Admin]
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
 *                 description: Image file to upload (max 5MB, allowed types jpeg, jpg, png, gif, webp)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                         imageUrl:
 *                           type: string
 *       400:
 *         description: Invalid file or file too large
 */
router.post("/admin/upload-image", uploadPhysicianImage, (req, res, next) => 
  physicianController.uploadPhysicianImage(req, res, next)
);

export { router as physicianRoutes };

