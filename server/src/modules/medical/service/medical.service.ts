import { MedicalRepository } from "../repository/medical.repository";
import { BookingRepository } from "../../booking/repository/booking.repository";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../../shared/errors";
import type { InsertMedication, LabReport } from "../models/medical.schema";
import path, { join } from "path";
import fs from "fs";
import { randomUUID } from "node:crypto";
import { PhysicianRepository } from "../../physician/repository/physician.repository";
import { UserRepository } from "../../user/repository/user.repository";
import { ALLOWED_TYPES, AZURE_FILE_STATUS, USER_ROLES, type UserRole } from "@shared/schema";
import { azureService } from "server/src/shared/services/azure.service";

export class MedicalService {
	private readonly medicalRepository: MedicalRepository;
	private readonly bookingRepository: BookingRepository;
	private readonly physicianRepository: PhysicianRepository;
	private readonly userRepository: UserRepository;

	constructor() {
		this.medicalRepository = new MedicalRepository();
		this.bookingRepository = new BookingRepository();
		this.physicianRepository = new PhysicianRepository();
		this.userRepository = new UserRepository();
	}
	static LAB_REPORT_PATH = join("public", "uploads", "lab-reports");

	// Meications Methods
	async createMedication(
		userId: string,
		data: Omit<InsertMedication, "userId">,
	): Promise<InsertMedication & { id: string }> {
		// Verify consultation exists and belongs to user
		const consultation = await this.bookingRepository.getBookedSlotById(
			data.consultationId,
		);
		if (!consultation || consultation.customerId !== userId) {
			throw new NotFoundError("Consultation not found");
		}

		const medication = await this.medicalRepository.createMedication({
			...data,
			userId,
		});

		return medication;
	}

	async getMedicationsByUserId(
		userId: string,
		limit: number = 10,
		offset: number = 0,
		skip?: number,
	) {
		const skipNumber = skip ? skip : offset;
		const [medications, total] = await Promise.all([
			this.medicalRepository.getMedicationsByUserId(userId, limit, skipNumber),
			this.medicalRepository.getMedicationsCountByUserId(userId),
		]);

		const physicianIds = Array.from(
			new Set(medications.map((m) => m.physicianId)),
		);

		const physicianUsers =
			await this.userRepository.getAllUsersByIds(physicianIds);

		const physicianInfoRecords =
			await this.physicianRepository.getPhysicianByIds(physicianIds);

		const physicianMap = new Map(
			physicianUsers.map((u) => [
				u.id,
				{
					id: u.id,
					firstName: u.firstName,
					lastName: u.lastName,
					specialty:
						physicianInfoRecords.find((p) => p.userId === u.id)?.specialty ||
						null,
				},
			]),
		);

		const enrichedMedications = medications.map((med) => ({
			...med,
			physician: physicianMap.get(med.physicianId) || null,
		}));

		return {
			medications: enrichedMedications,
			total,
			page: Math.floor(offset / limit) + 1,
			limit,
		};
	}

	async getMedicationsByPhysicianAndDate(
		userId: string,
		consultationId: string,
	) {
		const medications =
			await this.medicalRepository.getMedicationByConsultationId(
				consultationId,
			);

		if (medications.length === 0) {
			throw new NotFoundError("Medications not found");
		}

		const physicianUser = await this.userRepository.getUser(
			medications[0].physicianId,
		);

		if (!physicianUser) {
			throw new NotFoundError("physician not found");
		}

		return {
			medications,
			physician: physicianUser
				? {
						id: physicianUser.id,
						firstName: physicianUser.firstName,
						lastName: physicianUser.lastName,
						specialty: physicianUser.profileData?.speciality || null,
					}
				: null,
			prescriptionDate: medications.prescriptionDate,
		};
	}

	async uploadLabReport(
		userId: string,
		file: Express.Multer.File,
		metadata?: {
			reportName?: string;
			reportType?: string;
			dateOfReport?: string;
		},
	): Promise<LabReport> {
		const typeConfig =
			ALLOWED_TYPES[file.mimetype as keyof typeof ALLOWED_TYPES];
		if (!typeConfig) {
			throw new BadRequestError("File type not allowed");
		}
		if (file.size > typeConfig.maxSize) {
			throw new BadRequestError(
				`File size exceeds maximum of ${typeConfig.maxSize / (1024 * 1024)}MB for ${file.mimetype}`,
			);
		}

		const ext =
			path.extname(file.originalname) || `.${typeConfig.ext}`;
		const blobFileName = `${randomUUID()}${ext}`;
		const azureKey = azureService.createKeyForLabReports(blobFileName, userId);

		await azureService.uploadFile(
			file,
			azureKey,
		);

		return await this.medicalRepository.createLabReport({
			userId,
			fileName: file.originalname,
			filePath: azureKey,
			fileSize: file.size.toString(),
			reportName: metadata?.reportName,
			reportType: metadata?.reportType,
			dateOfReport: metadata?.dateOfReport,
		});
	}

	async getLabReportsPaginated(
		userId: string,
		limit: number,
		offset: number,
		search?: string,
	) {
		const result = await this.medicalRepository.getLabReportsPaginated(
			userId,
			limit,
			offset,
			search,
		);

		return {
			reports: result.reports,
			total: result.total,
		};
	}

	async verifyPhysicianPatientAccess(
		physicianId: string,
		patientId: string,
	): Promise<boolean> {
		return this.bookingRepository.hasPhysicianPatientRelationship(
			physicianId,
			patientId,
		);
	}

	async getLabReportsByUserId(userId: string) {
		return await this.medicalRepository.getLabReportsByUserId(userId);
	}

	async updateLabReport(
		reportId: string,
		userId: string,
		file: Express.Multer.File,
	): Promise<LabReport> {
		const typeConfig =
			ALLOWED_TYPES[file.mimetype as keyof typeof ALLOWED_TYPES];
		if (!typeConfig) {
			throw new BadRequestError("File type not allowed");
		}
		if (file.size > typeConfig.maxSize) {
			throw new BadRequestError(
				`File size exceeds maximum of ${typeConfig.maxSize / (1024 * 1024)}MB for ${file.mimetype}`,
			);
		}

		const existingReport = await this.medicalRepository.getLabReportById(
			reportId,
			userId,
		);
		if (!existingReport) {
			throw new NotFoundError("Lab report not found");
		}

		const ext =
			path.extname(file.originalname) || `.${typeConfig.ext}`;
		const blobFileName = `${randomUUID()}${ext}`;
		const azureKey = azureService.createKeyForLabReports(blobFileName, userId);

		await azureService.uploadFile(
			file,
			azureKey,
		);


		return await this.medicalRepository.updateLabReport(reportId, userId, {
			fileName: file.originalname,
			filePath: azureKey,
			fileSize: file.size.toString(),
			status: AZURE_FILE_STATUS.CONFIRMED,
		});
	}

	async deleteLabReport(reportId: string, userId: string): Promise<void> {
		const report = await this.medicalRepository.getLabReportById(
			reportId,
			userId,
		);
		if (!report) {
			throw new NotFoundError("Lab report not found");
		}

	
    try {
			await azureService.deleteFile(report.filePath);
		} catch {
		}


		await this.medicalRepository.deleteLabReport(reportId, userId);
	}

	async downloadLabReport(
		reportId: string,
		requesterId: string,
		role: UserRole,
	): Promise<
		{ blobKey: string; fileName: string }
	> {
		const report = await this.medicalRepository.getLabReportById(
			reportId,
			role === USER_ROLES.CUSTOMER ? requesterId : undefined,
		);

		if (!report) {
			throw new NotFoundError("Lab report not found");
		}

		if (role === USER_ROLES.PHYSICIAN) {
			const hasAccess = await this.verifyPhysicianPatientAccess(
				requesterId,
				report.userId,
			);
			if (!hasAccess) {
				throw new ForbiddenError(
					"You do not have access to this patient's lab reports",
				);
			}
		}

		if (report.status !== AZURE_FILE_STATUS.CONFIRMED) {
			throw new BadRequestError("Lab report not found");
		}

		

		return {
			blobKey: report.filePath,
			fileName: report.fileName,
		};
	}
}

