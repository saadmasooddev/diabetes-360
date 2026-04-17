import { Router } from "express";
import { MedicalController } from "../controllers/medical.controller";
import {
	authenticateToken,
	requireAnyPermission,
	requirePermission,
} from "../../../shared/middleware/auth";
import { PERMISSIONS } from "@shared/schema";

const router = Router();
const medicalController = new MedicalController();

const readOwnMedicalRecords = requireAnyPermission([
	PERMISSIONS.READ_OWN_MEDICAL_RECORDS,
]);
const createOwnMedicalRecords = requireAnyPermission([
	PERMISSIONS.CREATE_OWN_MEDICAL_RECORDS,
]);
const updateOwnMedicalRecords = requireAnyPermission([
	PERMISSIONS.UPDATE_OWN_MEDICAL_RECORDS,
]);
const deleteOwnMedicalRecords = requireAnyPermission([
	PERMISSIONS.DELETE_OWN_MEDICAL_RECORDS,
]);
const readPatientOrAllMedicalRecords = requireAnyPermission([
	PERMISSIONS.READ_PATIENT_MEDICAL_RECORDS,
	PERMISSIONS.READ_ALL_MEDICAL_RECORDS,
]);

/**
 * @swagger
 * /api/medical/medications:
 *   post:
 *     summary: Create a medication record (admin/physician only)
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consultationId
 *               - physicianId
 *               - prescriptionDate
 *               - medicines
 *             properties:
 *               consultationId:
 *                 type: string
 *               physicianId:
 *                 type: string
 *               prescriptionDate:
 *                 type: string
 *                 format: date-time
 *               medicines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     dosage:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     duration:
 *                       type: string
 *                     instructions:
 *                       type: string
 *     responses:
 *       200:
 *         description: Medication created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
	"/medications",
	authenticateToken,
	createOwnMedicalRecords,
	(req, res, next) => medicalController.createMedication(req, res, next),
);

/**
 * @swagger
 * /api/medical/medications:
 *   get:
 *     summary: Get user's medications
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Medications retrieved successfully
 */
router.get(
	"/medications",
	authenticateToken,
	readOwnMedicalRecords,
	(req, res, next) => medicalController.getMedications(req, res, next),
);

/**
 * @swagger
 * /api/medical/medications/by-physician:
 *   get:
 *     summary: Get medications by physician and date
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: physicianId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: prescriptionDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Medications retrieved successfully
 */
router.get(
	"/medications/by-consultation",
	authenticateToken,
	readOwnMedicalRecords,
	(req, res, next) =>
		medicalController.getMedicationsByPhysicianAndDate(req, res, next),
);

/**
 * @swagger
 * /api/medical/lab-reports/request-upload:
 *   post:
 *     summary: Request upload URL for a lab report (Azure SAS)
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - contentType
 *               - fileSize
 *             properties:
 *               fileName:
 *                 type: string
 *               contentType:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               reportName:
 *                 type: string
 *               reportType:
 *                 type: string
 *               dateOfReport:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload URL and reportId returned
 */
router.post(
  "/lab-reports/request-upload",
  authenticateToken,
  createOwnMedicalRecords,
  (req, res) => medicalController.getLabReportAzureUploadUrl(req, res),
);

/**
 * @swagger
 * /api/medical/lab-reports:
 *   get:
 *     summary: Get user's lab reports
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lab reports retrieved successfully
 */
router.get(
	"/lab-reports",
	authenticateToken,
	readOwnMedicalRecords,
	(req, res, next) => medicalController.getLabReports(req, res, next),
);

/**
 * @swagger
 * /api/medical/lab-reports/by-user/{userId}:
 *   get:
 *     summary: Get lab reports for a user (physician/admin only)
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lab reports retrieved successfully
 */
router.get(
	"/lab-reports/by-user/:userId",
	authenticateToken,
	readPatientOrAllMedicalRecords,
	(req, res, next) => medicalController.getLabReportsForUser(req, res, next),
);

const readLabReportForDownload = requireAnyPermission([
  PERMISSIONS.READ_OWN_MEDICAL_RECORDS,
  PERMISSIONS.READ_PATIENT_MEDICAL_RECORDS,
  PERMISSIONS.READ_ALL_MEDICAL_RECORDS,
]);

/**
 * @swagger
 * /api/medical/lab-reports/{id}/confirm:
 *   post:
 *     summary: Confirm lab report after upload to Azure
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lab report confirmed successfully
 */
router.post(
  "/lab-reports/:id/confirm",
  authenticateToken,
  createOwnMedicalRecords,
  (req, res) => medicalController.confirmLabReport(req, res),
);

/**
 * @swagger
 * /api/medical/lab-reports/{id}/download-url:
 *   get:
 *     summary: Get temporary download URL for a lab report
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Download URL and filename
 */
router.get(
  "/lab-reports/:id/download-url",
  authenticateToken,
  readLabReportForDownload,
  (req, res) => medicalController.getDownloadLabReportUrl(req, res),
);

/**
 * @swagger
 * /api/medical/lab-reports/{id}:
 *   delete:
 *     summary: Delete a lab report
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lab report deleted successfully
 */
router.delete(
  "/lab-reports/:id",
  authenticateToken,
  deleteOwnMedicalRecords,
  (req, res) => medicalController.deletelabReportAzureFile(req, res),
);

export { router as medicalRoutes };
