import { PhysicianRepository } from "../repository/physician.repository";
import type {
	InsertPhysicianSpecialty,
	UpdatePhysicianSpecialty,
	InsertPhysicianData,
	UpdatePhysicianData,
	InsertPhysicianRating,
	InsertPhysicianLocation,
	UpdatePhysicianLocation,
} from "../../auth/models/user.schema";
import { BadRequestError, NotFoundError } from "../../../shared/errors";
import path from "path";
import { randomUUID } from "node:crypto";
import { ALLOWED_TYPES } from "@shared/schema";
import { azureService } from "server/src/shared/services/azure.service";
import {
	isStoredPhysicianBlobKey,
	resolvePhysicianImageUrlForDisplay,
} from "../utils/resolve-physician-image-url";

export class PhysicianService {
	private physicianRepository: PhysicianRepository;

	constructor() {
		this.physicianRepository = new PhysicianRepository();
	}

	// Specialty operations
	async getAllSpecialties() {
		return await this.physicianRepository.getAllSpecialties();
	}

	async getSpecialtyById(id: string) {
		const specialty = await this.physicianRepository.getSpecialtyById(id);
		if (!specialty) {
			throw new NotFoundError("Specialty not found");
		}
		return specialty;
	}

	async createSpecialty(data: InsertPhysicianSpecialty) {
		return await this.physicianRepository.createSpecialty(data);
	}

	async updateSpecialty(id: string, data: UpdatePhysicianSpecialty) {
		const existing = await this.physicianRepository.getSpecialtyById(id);
		if (!existing) {
			throw new NotFoundError("Specialty not found");
		}
		return await this.physicianRepository.updateSpecialty(id, data);
	}

	async deleteSpecialty(id: string) {
		const existing = await this.physicianRepository.getSpecialtyById(id);
		if (!existing) {
			throw new NotFoundError("Specialty not found");
		}
		await this.physicianRepository.deleteSpecialty(id);
	}

	// Physician data operations
	async getPhysicianDataByUserId(userId: string) {
		const data =
			await this.physicianRepository.getPhysicianDataByUserId(userId);
		if (!data) {
			throw new NotFoundError("Physician data not found");
		}
		return data;
	}

	async createPhysicianData(data: InsertPhysicianData) {
		// Check if physician data already exists
		const existing = await this.physicianRepository.getPhysicianDataByUserId(
			data.userId,
		);
		if (existing) {
			throw new BadRequestError("Physician data already exists for this user");
		}

		this.validatePracticeStartDate(data.practiceStartDate?.toString() || "");

		return await this.physicianRepository.createPhysicianData(data);
	}

	async updatePhysicianData(userId: string, data: UpdatePhysicianData) {
		this.validatePracticeStartDate(data.practiceStartDate?.toString() || "");

		return await this.physicianRepository.updatePhysicianData(userId, data);
	}

	async deletePhysicianData(userId: string) {
		await this.physicianRepository.deletePhysicianData(userId);
	}

	// Consultation operations
	async getSpecialtiesForConsultation() {
		return await this.physicianRepository.getSpecialtiesForConsultation();
	}

	async getPhysiciansPaginated(params: {
		page: number;
		limit: number;
		timeZone: string;
		date: string;
		dateWithTimezone: string;
		skip?: number;
		search?: string;
		specialtyId?: string;
	}) {
		// Validate specialty if provided
		if (params.specialtyId) {
			const specialty = await this.physicianRepository.getSpecialtyById(
				params.specialtyId,
			);
			if (!specialty) {
				throw new NotFoundError("Specialty not found");
			}
		}

		const result =
			await this.physicianRepository.getPhysiciansPaginated(params);
		const physicians = await Promise.all(
			result.physicians.map(async (p) => ({
				...p,
				imageUrl: await resolvePhysicianImageUrlForDisplay(p.imageUrl),
			})),
		);
		return { ...result, physicians };
	}

	async getPhysiciansBySpecialty(
		specialtyId: string,
		timeZone: string,
		userDateISO: string,
		fromDate: string,
	) {
		const specialty =
			await this.physicianRepository.getSpecialtyById(specialtyId);
		if (!specialty) {
			throw new NotFoundError("Specialty not found");
		}
		const physicians =
			await this.physicianRepository.getPhysiciansBySpecialityAndNextAvailableSlot(
				specialtyId,
				timeZone,
				userDateISO,
				fromDate,
			);
		return await Promise.all(
			physicians.map(async (p) => ({
				...p,
				imageUrl: await resolvePhysicianImageUrlForDisplay(p.imageUrl),
			})),
		);
	}

	// Rating operations
	async createRating(data: InsertPhysicianRating) {
		// Check if customer has already rated this physician
		// For now, we'll allow multiple ratings (could be changed to one per customer)
		await this.physicianRepository.createRating(data);
	}

	async getPhysicianAverageRating(physicianId: string) {
		return await this.physicianRepository.getPhysicianAverageRating(
			physicianId,
		);
	}

	/**
	 * Admin uploads profile image to the server; file is stored in Azure Blob Storage.
	 * Returns the blob key stored in `physician_data.imageUrl` (same shape as SAS flow).
	 */
	async uploadPhysicianProfileImageFromFile(
		targetUserId: string,
		file: Express.Multer.File,
	): Promise<string> {
		const existing =
			await this.physicianRepository.getPhysicianDataByUserId(targetUserId);
		if (!existing) {
			throw new BadRequestError("Physician data not found");
		}

		const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
		const typeConfig =
			ALLOWED_TYPES[file.mimetype as keyof typeof ALLOWED_TYPES];
		if (
			!typeConfig ||
			!imageTypes.includes(file.mimetype as (typeof imageTypes)[number])
		) {
			throw new BadRequestError("File type not allowed for profile images");
		}
		if (file.size > typeConfig.maxSize) {
			throw new BadRequestError(
				`File size exceeds maximum of ${typeConfig.maxSize / (1024 * 1024)}MB for ${file.mimetype}`,
			);
		}

		const ext = path.extname(file.originalname) || `.${typeConfig.ext}`;
		const blobFileName = `${randomUUID()}${ext}`;
		const azureKey = azureService.createKeyForProfilePicture(
			blobFileName,
			targetUserId,
		);

		await azureService.uploadFile(file, azureKey);

		const oldUrl = existing.imageUrl;
		if (
			oldUrl &&
			isStoredPhysicianBlobKey(oldUrl) &&
			oldUrl !== azureKey
		) {
			try {
				await azureService.deleteFile(oldUrl);
			} catch {
				// best-effort cleanup
			}
		}

		await this.physicianRepository.updatePhysicianData(targetUserId, {
			imageUrl: azureKey,
		});

		return azureKey;
	}

	async getPhysicianDataWithProfileReadUrl(userId: string) {
		const data = await this.getPhysicianDataByUserId(userId);
		const profileImageUrl = await resolvePhysicianImageUrlForDisplay(
			data.imageUrl,
		);
		return { ...data, profileImageUrl };
	}

	private validatePracticeStartDate(practiceStartDate: string) {
		const practiceDate = new Date(practiceStartDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (practiceDate > today) {
			throw new BadRequestError("Practice start date cannot be in the future");
		}
	}

	// Location operations
	async getAllLocationsByPhysicianId(physicianId: string) {
		return await this.physicianRepository.getAllLocationsByPhysicianId(
			physicianId,
		);
	}

	async getLocationById(id: string) {
		const location = await this.physicianRepository.getLocationById(id);
		if (!location) {
			throw new NotFoundError("Location not found");
		}
		return location;
	}

	async createLocation(physicianId: string, data: InsertPhysicianLocation) {
		return await this.physicianRepository.createLocation({
			...data,
			physicianId,
		});
	}

	async updateLocation(
		id: string,
		physicianId: string,
		data: UpdatePhysicianLocation,
	) {
		const location = await this.physicianRepository.getLocationById(id);
		if (!location) {
			throw new NotFoundError("Location not found");
		}
		if (location.physicianId !== physicianId) {
			throw new BadRequestError("You can only update your own locations");
		}
		return await this.physicianRepository.updateLocation(id, data);
	}

	async deleteLocation(id: string, physicianId: string) {
		const location = await this.physicianRepository.getLocationById(id);
		if (!location) {
			throw new NotFoundError("Location not found");
		}
		if (location.physicianId !== physicianId) {
			throw new BadRequestError("You can only delete your own locations");
		}
		await this.physicianRepository.deleteLocation(id);
	}
}
