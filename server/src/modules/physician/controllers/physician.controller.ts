import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { PhysicianService } from "../service/physician.service";
import { PatientService } from "../service/patient.service";
import { BadRequestError } from "../../../shared/errors";
import {
	insertPhysicianSpecialtySchema,
	updatePhysicianSpecialtySchema,
	insertPhysicianDataSchema,
	updatePhysicianDataSchema,
	insertPhysicianRatingSchema,
	insertPhysicianLocationSchema,
	updatePhysicianLocationSchema,
	USER_ROLES,
} from "../../auth/models/user.schema";
import { handleError } from "../../../shared/middleware/errorHandler";
import { getPaginationParams } from "server/src/shared/utils/utils";
import { config } from "server/src/app/config";

export class PhysicianController {
	private physicianService: PhysicianService;
	private patientService: PatientService;

	constructor() {
		this.physicianService = new PhysicianService();
		this.patientService = new PatientService();
	}

	// Specialty endpoints
	async getAllSpecialties(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const specialties = await this.physicianService.getAllSpecialties();
			sendSuccess(res, { specialties }, "Specialties retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getSpecialtyById(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			if (!id) {
				throw new BadRequestError("Specialty ID is required");
			}
			const specialty = await this.physicianService.getSpecialtyById(id);
			sendSuccess(res, { specialty }, "Specialty retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createSpecialty(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const validationResult = insertPhysicianSpecialtySchema.safeParse(
				req.body,
			);
			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid specialty data",
				);
			}
			const specialty = await this.physicianService.createSpecialty(
				validationResult.data,
			);
			sendSuccess(res, { specialty }, "Specialty created successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updateSpecialty(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			if (!id) {
				throw new BadRequestError("Specialty ID is required");
			}
			const validationResult = updatePhysicianSpecialtySchema.safeParse(
				req.body,
			);
			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid specialty data",
				);
			}
			const specialty = await this.physicianService.updateSpecialty(
				id,
				validationResult.data,
			);
			sendSuccess(res, { specialty }, "Specialty updated successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async deleteSpecialty(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			if (!id) {
				throw new BadRequestError("Specialty ID is required");
			}
			await this.physicianService.deleteSpecialty(id);
			sendSuccess(res, null, "Specialty deleted successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Physician data endpoints
	async getPhysicianData(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { userId } = req.params;
			if (!userId) {
				throw new BadRequestError("User ID is required");
			}
			const data = await this.physicianService.getPhysicianDataByUserId(userId);
			sendSuccess(
				res,
				{ physicianData: data },
				"Physician data retrieved successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createPhysicianData(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const validationResult = insertPhysicianDataSchema.safeParse(req.body);
			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid physician data",
				);
			}
			const data = await this.physicianService.createPhysicianData(
				validationResult.data,
			);
			sendSuccess(
				res,
				{ physicianData: data },
				"Physician data created successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updatePhysicianData(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { userId } = req.params;
			if (!userId) {
				throw new BadRequestError("User ID is required");
			}
			const validationResult = updatePhysicianDataSchema.safeParse(req.body);
			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid physician data",
				);
			}
			const data = await this.physicianService.updatePhysicianData(
				userId,
				validationResult.data,
			);
			sendSuccess(
				res,
				{ physicianData: data },
				"Physician data updated successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Consultation endpoints (public - no auth required)
	async getSpecialtiesForConsultation(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const specialties =
				await this.physicianService.getSpecialtiesForConsultation();
			sendSuccess(res, { specialties }, "Specialties retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPhysiciansPaginated(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const search = req.query.search as string | undefined;
			const specialtyId = req.query.specialtyId as string | undefined;
			const { page, limit, offset  } = getPaginationParams(req)

			const { date, timeZone } = req.query as { date: string; timeZone: string };

			if (!timeZone || !Intl.supportedValuesOf("timeZone").includes(timeZone)) {
				throw new BadRequestError("Invalid timezone");
			}

			const numberDate = new Date(date).getTime();
			if (isNaN(numberDate)) {
				throw new BadRequestError("Invalid date format");
			}

			const dateWithTimezone = new Intl.DateTimeFormat("en-US", {
				day: "numeric",
				month: "numeric",
				year: "numeric",
				hour: "numeric",
				minute: "numeric",
				second: "numeric",
				timeZone,
			}).format(Number(numberDate));

			const result = await this.physicianService.getPhysiciansPaginated({
				page,
				limit: limit || config.pagination.limit,
				skip: offset,
				search,
				specialtyId,
				date,
				timeZone,
				dateWithTimezone
			});

			sendSuccess(res, result, "Physicians retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPhysiciansBySpecialty(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { specialtyId } = req.params;
			if (!specialtyId) {
				throw new BadRequestError("Specialty ID is required");
			}
			const { date, timeZone } = req.query as { date: string; timeZone: string };

			if (!timeZone || !Intl.supportedValuesOf("timeZone").includes(timeZone)) {
				throw new BadRequestError("Invalid timezone");
			}

			const numberDate = new Date(date).getTime();
			if (isNaN(numberDate)) {
				throw new BadRequestError("Invalid date format");
			}

			const dateWithTimezone = new Intl.DateTimeFormat("en-US", {
				day: "numeric",
				month: "numeric",
				year: "numeric",
				hour: "numeric",
				minute: "numeric",
				second: "numeric",
				timeZone,
			}).format(Number(numberDate));

			const physicians =
				await this.physicianService.getPhysiciansBySpecialty(
					specialtyId,
					timeZone,
					date,
					dateWithTimezone,
				);
			sendSuccess(res, { physicians }, "Physicians retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Rating endpoints
	async createRating(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const validationResult = insertPhysicianRatingSchema.safeParse({
				...req.body,
				customerId: req.user?.userId,
			});
			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid rating data",
				);
			}
			await this.physicianService.createRating(validationResult.data);
			sendSuccess(res, null, "Rating created successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPhysicianRating(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { physicianId } = req.params;
			if (!physicianId) {
				throw new BadRequestError("Physician ID is required");
			}
			const rating =
				await this.physicianService.getPhysicianAverageRating(physicianId);
			sendSuccess(res, { rating }, "Rating retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Image upload endpoint using multer
	async uploadPhysicianImage(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const file = req.file;
			if (!file) {
				throw new BadRequestError("Image file is required");
			}

			// Get the relative URL path for the uploaded file
			const imageUrl = await this.physicianService.getImageUrlFromFile(file);

			sendSuccess(res, { imageUrl }, "Image uploaded successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Location endpoints
	async getAllLocations(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}
			const locations =
				await this.physicianService.getAllLocationsByPhysicianId(physicianId);
			sendSuccess(res, { locations }, "Locations retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Admin endpoint to get locations for a specific physician
	async getAllLocationsByPhysicianId(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { physicianId } = req.params;
			if (!physicianId) {
				throw new BadRequestError("Physician ID is required");
			}
			const locations =
				await this.physicianService.getAllLocationsByPhysicianId(physicianId);
			sendSuccess(res, { locations }, "Locations retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createLocation(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}
			const validationResult = insertPhysicianLocationSchema.safeParse(
				req.body,
			);
			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid location data",
				);
			}
			const location = await this.physicianService.createLocation(
				physicianId,
				validationResult.data,
			);
			sendSuccess(res, { location }, "Location created successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updateLocation(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			const physicianId = req.user?.userId;
			if (!id) {
				throw new BadRequestError("Location ID is required");
			}
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}
			const validationResult = updatePhysicianLocationSchema.safeParse(
				req.body,
			);
			if (!validationResult.success) {
				throw new BadRequestError(
					validationResult.error.message || "Invalid location data",
				);
			}
			const location = await this.physicianService.updateLocation(
				id,
				physicianId,
				validationResult.data,
			);
			sendSuccess(res, { location }, "Location updated successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async deleteLocation(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { id } = req.params;
			const physicianId = req.user?.userId;
			if (!id) {
				throw new BadRequestError("Location ID is required");
			}
			if (!physicianId) {
				throw new BadRequestError("User ID not found");
			}
			await this.physicianService.deleteLocation(id, physicianId);
			sendSuccess(res, null, "Location deleted successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Patient endpoints
	async getPatients(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { limit, offset, page } = getPaginationParams(req)
			const search = req.query.search as string | undefined;
			const physicianId =
				req.user?.role === USER_ROLES.PHYSICIAN ? req.user?.userId : undefined;

			const result = await this.patientService.getPatientsPaginated({
				page,
				offset,
				limit: limit || config.pagination.limit,
				search,
				physicianId,
			});

			sendSuccess(res, result, "Patients retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPatientStats(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const physicianId =
				req.user?.role === USER_ROLES.PHYSICIAN ? req.user?.userId : undefined;
			const stats = await this.patientService.getPatientStats(physicianId);
			sendSuccess(res, stats, "Patient statistics retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPatientById(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { patientId } = req.params;
			const { startDate, endDate } = req.query;
			if (!patientId) {
				throw new BadRequestError("Patient ID is required");
			}
			const user = req?.user;
			const physicianId =
				user?.role === USER_ROLES.PHYSICIAN ? user?.userId : undefined;

			const startDateObj = new Date(startDate as string);
			const endDateObj = new Date(endDate as string);
			if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
				throw new BadRequestError("Invalid date format");
			}
			const patient = await this.patientService.getPatientById(
				patientId,
				startDate as string,
				endDate as string,
				physicianId,
			);
			sendSuccess(res, { patient }, "Patient retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPatientAlerts(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const user = req?.user;
			// For physicians, only show their patients. For admins, show all patients
			const physicianId =
				user?.role === USER_ROLES.PHYSICIAN ? user?.userId : undefined;

			const alerts = await this.patientService.getPatientAlerts(physicianId);
			sendSuccess(res, alerts, "Patient alerts retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getPatientsHome(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const physicianId = req.user?.userId;
			const date = req.query.date as string;
			if (!date || isNaN(new Date(date).getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const result = await this.patientService.getPatientsHome(
				physicianId!,
				date,
			);
			return sendSuccess(
				res,
				result,
				"Patients data for home page retrieved successfully",
			);
		} catch (error) {
			handleError(res, error);
		}
	}
}
