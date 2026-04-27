import { Router } from "express";
import { PhysicianController } from "../controllers/physician.controller";
import {
	authenticateToken,
	requireAnyPermission,
} from "../../../shared/middleware/auth";
import { PERMISSIONS } from "../../auth/models/user.schema";
import { imageMemoryUpload } from "../../../shared/config/multer.config";

const router = Router();

router.use(authenticateToken);

const physicianController = new PhysicianController();

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
router.get("/specialties", (req, res, next) =>
	physicianController.getSpecialtiesForConsultation(req, res, next),
);

/**
 * @swagger
 * /api/physician/physicians:
 *   get:
 *     summary: Get paginated physicians with search and specialty filtering
 *     tags: [Consultation]
 *     description: >
 *       Retrieves a paginated list of physicians. You can filter the list by specialty and
 *       search by name or specialty keyword. All query parameters are optional.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to retrieve (starts from 1). Default is 1.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of physicians per page (default is 10; max is 100).
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: >
 *           Search term to filter by physician name or specialty. If set to "all", all physicians will be shown (only applies when specialtyId is not provided).
 *       - in: query
 *         name: specialtyId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter physicians by a specific specialty ID.
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
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               specialty:
 *                                 type: string
 *                               experience:
 *                                 type: string
 *                               rating:
 *                                 type: number
 *                               totalRatings:
 *                                 type: integer
 *                               consultationFee:
 *                                 type: string
 *                               imageUrl:
 *                                 type: string
 *                                 nullable: true
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             hasNext:
 *                               type: boolean
 *                             hasPrev:
 *                               type: boolean
 *       400:
 *         description: Bad request (invalid page, limit, or specialtyId)
 */
router.get("/physicians", (req, res, next) =>
	physicianController.getPhysiciansPaginated(req, res, next),
);

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
 *                               username:
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
	physicianController.getPhysiciansBySpecialty(req, res, next),
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
	physicianController.getPhysicianRating(req, res, next),
);

/**
 * @swagger
 * /api/physician/ratings:
 *   post:
 *     summary: Create a physician rating (Authenticated)
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - physicianId
 *               - rating
 *             properties:
 *               physicianId:
 *                 type: string
 *                 description: ID of the physician being rated
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value from 1 to 5
 *               comment:
 *                 type: string
 *                 description: Optional comment about the rating
 *     responses:
 *       200:
 *         description: Rating created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - validation error
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
 */
router.post("/ratings", (req, res, next) =>
	physicianController.createRating(req, res, next),
);

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
	physicianController.getAllSpecialties(req, res, next),
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
	physicianController.getSpecialtyById(req, res, next),
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
	physicianController.createSpecialty(req, res, next),
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
	physicianController.updateSpecialty(req, res, next),
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
	physicianController.deleteSpecialty(req, res, next),
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
	physicianController.getPhysicianData(req, res, next),
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
	physicianController.createPhysicianData(req, res, next),
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
	physicianController.updatePhysicianData(req, res, next),
);

/**
 * @swagger
 * /api/physician/admin/upload-image:
 *   post:
 *     summary: Upload physician profile image (multipart); server stores file in Azure
 *     tags: [Admin]
 */
router.post(
	"/admin/upload-image",
	requireAnyPermission([
		PERMISSIONS.CREATE_USERS,
		PERMISSIONS.UPDATE_USERS,
	]),
	(req, res, next) => imageMemoryUpload.single("image")(req, res, next),
	(req, res, next) => physicianController.uploadPhysicianImage(req, res, next),
);

/**
 * @swagger
 * /api/physician/admin/locations/{physicianId}:
 *   get:
 *     summary: Get all locations for a specific physician (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Physician ID
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
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
 *                         locations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PhysicianLocation'
 *       401:
 *         description: Unauthorized
 */
router.get("/admin/locations/:physicianId", (req, res, next) =>
	physicianController.getAllLocationsByPhysicianId(req, res, next),
);

/**
 * @swagger
 * /api/physician/locations:
 *   get:
 *     summary: Get all locations for the authenticated physician
 *     tags: [Physician Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
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
 *                         locations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PhysicianLocation'
 *       401:
 *         description: Unauthorized
 */
router.get("/locations", (req, res, next) =>
	physicianController.getAllLocations(req, res, next),
);

/**
 * @swagger
 * /api/physician/locations:
 *   post:
 *     summary: Create a new location for the authenticated physician
 *     tags: [Physician Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationName
 *               - latitude
 *               - longitude
 *             properties:
 *               locationName:
 *                 type: string
 *                 example: "Main Clinic"
 *               address:
 *                 type: string
 *                 example: "123 Main Street"
 *               city:
 *                 type: string
 *                 example: "Karachi"
 *               state:
 *                 type: string
 *                 example: "Sindh"
 *               country:
 *                 type: string
 *                 example: "Pakistan"
 *               postalCode:
 *                 type: string
 *                 example: "75500"
 *               latitude:
 *                 type: string
 *                 example: "24.8607"
 *               longitude:
 *                 type: string
 *                 example: "67.0011"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       200:
 *         description: Location created successfully
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
 *                         location:
 *                           $ref: '#/components/schemas/PhysicianLocation'
 *       400:
 *         description: Invalid location data
 *       401:
 *         description: Unauthorized
 */
router.post("/locations", (req, res, next) =>
	physicianController.createLocation(req, res, next),
);

/**
 * @swagger
 * /api/physician/locations/{id}:
 *   patch:
 *     summary: Update a location for the authenticated physician
 *     tags: [Physician Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locationName:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               latitude:
 *                 type: string
 *               longitude:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                         location:
 *                           $ref: '#/components/schemas/PhysicianLocation'
 *       400:
 *         description: Invalid location data or unauthorized
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Location not found
 */
router.patch("/locations/:id", (req, res, next) =>
	physicianController.updateLocation(req, res, next),
);

/**
 * @swagger
 * /api/physician/locations/{id}:
 *   delete:
 *     summary: Delete a location for the authenticated physician
 *     tags: [Physician Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Unauthorized
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Location not found
 */
router.delete("/locations/:id", (req, res, next) =>
	physicianController.deleteLocation(req, res, next),
);

/**
 * @swagger
 * /api/physician/patients:
 *   get:
 *     summary: Get paginated list of patients
 *     description: Returns patients where the authenticated physician is the latest consulting physician. For physicians, only shows patients where they are the most recent physician to have consulted with the patient. For admins, shows all patients.
 *     tags: [Physician]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
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
 *                         patients:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               age:
 *                                 type: number
 *                               condition:
 *                                 type: string
 *                               indication:
 *                                 type: string
 *                                 enum: [Needs Attention, Stable, High Risk]
 *                               indicationColor:
 *                                 type: string
 *                                 description: Color code for the indication (hex format)
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 */
router.get("/patients", (req, res, next) =>
	physicianController.getPatients(req, res, next),
);

/**
 * @swagger
 * /api/physician/patients/stats:
 *   get:
 *     summary: Get patient statistics for pie charts
 *     description: Returns patient statistics (disease distribution and indication distribution) for patients where the authenticated physician is the latest consulting physician. For physicians, only includes patients where they are the most recent physician to have consulted with the patient. For admins, includes all patients.
 *     tags: [Physician]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient statistics retrieved successfully
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
 *                         diseaseDistribution:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               percentage:
 *                                 type: number
 *                               color:
 *                                 type: string
 *                         indicationDistribution:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               percentage:
 *                                 type: number
 *                               color:
 *                                 type: string
 */
router.get("/patients/stats", (req, res, next) =>
	physicianController.getPatientStats(req, res, next),
);

/**
 * @swagger
 * /api/physician/patients/{patientId}:
 *   get:
 *     summary: Get patient profile by ID
 *     tags: [Physician]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient profile retrieved successfully
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
 *                         patient:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             age:
 *                               type: number
 *                             condition:
 *                               type: string
 *                             riskLevel:
 *                               type: string
 *                             riskLevelColor:
 *                               type: string
 *                               description: Color code for the risk level (hex format)
 *                             indication:
 *                               type: string
 *                               enum: [Needs Attention, Stable, High Risk]
 *                             indicationColor:
 *                               type: string
 *                               description: Color code for the indication (hex format)
 *                             alerts:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   text:
 *                                     type: string
 *                                   color:
 *                                     type: string
 *                                     description: Color code for the alert (hex format)
 *                             glucoseSummary:
 *                               type: object
 *                             recentNotes:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             appointments:
 *                               type: array
 *                             glucoseTrend:
 *                               type: array
 */
router.get("/patients/:patientId", (req, res, next) =>
	physicianController.getPatientById(req, res, next),
);

/**
 * @swagger
 * /api/physician/patient-alerts:
 *   get:
 *     summary: Get patient alerts grouped by indication
 *     description: |
 *       Returns patient alerts grouped by indication (high-risk, stable, needs-attention).
 *       Status is calculated from blood glucose (bloodSugarAlert thresholds), activity from steps in last 24h, and meal status from loggedMeals (missed meals, over/under eating vs daily recommendation).
 *       Tag values may include: Glucose Spikes, No Activity in last 24hrs, Missed Meals, Over Eating, Under Eating, No Alerts.
 *       For physicians, only shows patients where they are the latest consulting physician. For admins, shows all patients. Returns maximum 4 patients per indication, randomly selected.
 *     tags: [Physician]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient alerts retrieved successfully
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
 *                         highRisk:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               age:
 *                                 type: number
 *                               diabetesType:
 *                                 type: string
 *                               tags:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                     color:
 *                                       type: string
 *                                       description: Color code for the tag (hex format)
 *                               status:
 *                                 type: string
 *                                 enum: [high-risk]
 *                               statusColor:
 *                                 type: string
 *                                 description: Color code for the status (hex format)
 *                         stable:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               age:
 *                                 type: number
 *                               diabetesType:
 *                                 type: string
 *                               tags:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                     color:
 *                                       type: string
 *                                       description: Color code for the tag (hex format)
 *                               status:
 *                                 type: string
 *                                 enum: [stable]
 *                               statusColor:
 *                                 type: string
 *                                 description: Color code for the status (hex format)
 *                         needsAttention:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               age:
 *                                 type: number
 *                               diabetesType:
 *                                 type: string
 *                               tags:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                     color:
 *                                       type: string
 *                                       description: Color code for the tag (hex format)
 *                               status:
 *                                 type: string
 *                                 enum: [needs-attention]
 *                               statusColor:
 *                                 type: string
 *                                 description: Color code for the status (hex format)
 */
router.get(
	"/patient-alerts",
	authenticateToken,
	requireAnyPermission([
		PERMISSIONS.READ_PATIENT_ALERTS,
		PERMISSIONS.READ_ALL_PATIENTS,
	]),
	(req, res, next) => physicianController.getPatientAlerts(req, res, next),
);

router.get(
	"/home",
	requireAnyPermission([
		PERMISSIONS.READ_PATIENT_ALERTS,
		PERMISSIONS.READ_OWN_APPOINTMENTS,
	]),
	(req, res) => physicianController.getPatientsHome(req, res),
);

export { router as physicianRoutes };
