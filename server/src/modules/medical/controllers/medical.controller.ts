import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { MedicalService } from "../service/medical.service";
import { BadRequestError, ForbiddenError } from "../../../shared/errors";
import { PERMISSIONS } from "../../auth/models/user.schema";
import { handleError } from "../../../shared/middleware/errorHandler";
import { insertMedicationSchema } from "../models/medical.schema";

export class MedicalController {
	private medicalService: MedicalService;

	constructor() {
		this.medicalService = new MedicalService();
	}

	async createMedication(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const validationResult = insertMedicationSchema.safeParse({
				...req.body,
				userId,
			});

			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid medication data",
				);
			}

			const medication = await this.medicalService.createMedication(
				userId,
				validationResult.data,
			);
			sendSuccess(res, medication, "Medication created successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getMedications(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
			const offset = req.query.offset
				? parseInt(req.query.offset as string)
				: 0;
			const skip = parseInt(req.query.skip as string);

			if (limit < 1 || limit > 100) {
				throw new BadRequestError("Limit must be between 1 and 100");
			}
			if (offset < 0 || skip < 0) {
				throw new BadRequestError("Offset must be non-negative");
			}

			const result = await this.medicalService.getMedicationsByUserId(
				userId,
				limit,
				offset,
				skip,
			);
			sendSuccess(res, result, "Medications retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getMedicationsByPhysicianAndDate(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const { physicianId, prescriptionDate } = req.query;

			if (!physicianId || !prescriptionDate) {
				throw new BadRequestError(
					"physicianId and prescriptionDate are required",
				);
			}

			const result = await this.medicalService.getMedicationsByPhysicianAndDate(
				userId,
				physicianId as string,
				prescriptionDate as string,
			);
			sendSuccess(res, result, "Medications retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async uploadLabReport(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			if (!req.file) {
				throw new BadRequestError("No file uploaded");
			}

			const reportName = req.body?.reportName as string | undefined;
			const reportType = req.body?.reportType as string | undefined;
			const dateOfReport = req.body?.dateOfReport as string | undefined;

			const report = await this.medicalService.uploadLabReport(userId, req.file, {
				reportName: reportName || undefined,
				reportType: reportType || undefined,
				dateOfReport: dateOfReport || undefined,
			});
			sendSuccess(res, report, "Lab report uploaded successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getLabReports(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const limit = req.query.limit
				? Math.min(100, Math.max(1, parseInt(req.query.limit as string)))
				: 10;
			const offset = req.query.offset
				? Math.max(0, parseInt(req.query.offset as string))
				: 0;
			const search = (req.query.search as string) || undefined;

			const result = await this.medicalService.getLabReportsPaginated(
				userId,
				limit,
				offset,
				search,
			);
			sendSuccess(res, result, "Lab reports retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getLabReportsForUser(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const requesterId = req.user?.userId || "";
			const permissions = req.user?.permissions || [];
			const targetUserId = req.params.userId;

			if (!requesterId || !targetUserId) {
				throw new BadRequestError("User ID is required");
			}

			const isAdmin = permissions.includes(PERMISSIONS.READ_ALL_MEDICAL_RECORDS);
			const isPhysician = permissions.includes(
				PERMISSIONS.READ_PATIENT_MEDICAL_RECORDS,
			);

			if (!isAdmin && !isPhysician) {
				throw new ForbiddenError(
					"Access denied. Physician or admin permission required.",
				);
			}

			if (isPhysician && !isAdmin) {
				const hasAccess = await this.medicalService.verifyPhysicianPatientAccess(
					requesterId,
					targetUserId,
				);
				if (!hasAccess) {
					throw new ForbiddenError(
						"You do not have access to this patient's lab reports",
					);
				}
			}

			const limit = req.query.limit
				? Math.min(100, Math.max(1, parseInt(req.query.limit as string)))
				: 10;
			const offset = req.query.offset
				? Math.max(0, parseInt(req.query.offset as string))
				: 0;
			const search = (req.query.search as string) || undefined;

			const result = await this.medicalService.getLabReportsPaginated(
				targetUserId,
				limit,
				offset,
				search,
			);
			sendSuccess(res, result, "Lab reports retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updateLabReport(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const reportId = req.params.id;
			if (!reportId) {
				throw new BadRequestError("Report ID is required");
			}

			if (!req.file) {
				throw new BadRequestError("No file uploaded");
			}

			const report = await this.medicalService.updateLabReport(
				reportId,
				userId,
				req.file,
			);
			sendSuccess(res, report, "Lab report updated successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async deleteLabReport(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const reportId = req.params.id;
			if (!reportId) {
				throw new BadRequestError("Report ID is required");
			}

			await this.medicalService.deleteLabReport(reportId, userId);
			sendSuccess(res, null, "Lab report deleted successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async downloadLabReport(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const requesterId = req.user?.userId || "";
			const permissions = req.user?.permissions || [];
			if (!requesterId) {
				throw new BadRequestError("User ID not found");
			}

			const reportId = req.params.id;
			if (!reportId) {
				throw new BadRequestError("Report ID is required");
			}

			let ownerUserId = requesterId;
			const forUser = req.query.userId as string | undefined;
			if (forUser) {
				const isAdmin = permissions.includes(
					PERMISSIONS.READ_ALL_MEDICAL_RECORDS,
				);
				const isPhysician = permissions.includes(
					PERMISSIONS.READ_PATIENT_MEDICAL_RECORDS,
				);
				if (isAdmin || isPhysician) {
					if (isPhysician && !isAdmin) {
						const hasAccess =
							await this.medicalService.verifyPhysicianPatientAccess(
								requesterId,
								forUser,
							);
						if (!hasAccess) {
							throw new ForbiddenError(
								"You do not have access to this patient's lab reports",
							);
						}
					}
					ownerUserId = forUser;
				}
			}

			const { filePath, fileName } =
				await this.medicalService.downloadLabReport(reportId, ownerUserId);

			// Send file
			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="${encodeURIComponent(fileName)}"`,
			);
			res.sendFile(filePath);
		} catch (error: any) {
			handleError(res, error);
		}
	}
}
