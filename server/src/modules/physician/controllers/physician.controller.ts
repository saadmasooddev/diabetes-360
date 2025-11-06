import { Response, NextFunction } from "express";
import { type AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { PhysicianService } from "../service/physician.service";
import { BadRequestError } from "../../../shared/errors";
import { 
  insertPhysicianSpecialtySchema, 
  updatePhysicianSpecialtySchema,
  insertPhysicianDataSchema,
  updatePhysicianDataSchema,
  insertPhysicianRatingSchema,
} from "../../auth/models/user.schema";
import { handleError } from "../../../shared/middleware/errorHandler";

export class PhysicianController {
  private physicianService: PhysicianService;

  constructor() {
    this.physicianService = new PhysicianService();
  }

  // Specialty endpoints
  async getAllSpecialties(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialties = await this.physicianService.getAllSpecialties();
      sendSuccess(res, { specialties }, "Specialties retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getSpecialtyById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

  async createSpecialty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = insertPhysicianSpecialtySchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid specialty data");
      }
      const specialty = await this.physicianService.createSpecialty(validationResult.data);
      sendSuccess(res, { specialty }, "Specialty created successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateSpecialty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError("Specialty ID is required");
      }
      const validationResult = updatePhysicianSpecialtySchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid specialty data");
      }
      const specialty = await this.physicianService.updateSpecialty(id, validationResult.data);
      sendSuccess(res, { specialty }, "Specialty updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async deleteSpecialty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  async getPhysicianData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        throw new BadRequestError("User ID is required");
      }
      const data = await this.physicianService.getPhysicianDataByUserId(userId);
      sendSuccess(res, { physicianData: data }, "Physician data retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async createPhysicianData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = insertPhysicianDataSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid physician data");
      }
      const data = await this.physicianService.createPhysicianData(validationResult.data);
      sendSuccess(res, { physicianData: data }, "Physician data created successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updatePhysicianData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        throw new BadRequestError("User ID is required");
      }
      const validationResult = updatePhysicianDataSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid physician data");
      }
      const data = await this.physicianService.updatePhysicianData(userId, validationResult.data);
      sendSuccess(res, { physicianData: data }, "Physician data updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Consultation endpoints (public - no auth required)
  async getSpecialtiesForConsultation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialties = await this.physicianService.getSpecialtiesForConsultation();
      sendSuccess(res, { specialties }, "Specialties retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAllPhysicians(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const physicians = await this.physicianService.getAllPhysicians();
      sendSuccess(res, { physicians }, "Physicians retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getPhysiciansBySpecialty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { specialtyId } = req.params;
      if (!specialtyId) {
        throw new BadRequestError("Specialty ID is required");
      }
      const physicians = await this.physicianService.getPhysiciansBySpecialty(specialtyId);
      sendSuccess(res, { physicians }, "Physicians retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Rating endpoints
  async createRating(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = insertPhysicianRatingSchema.safeParse({
        ...req.body,
        customerId: req.user?.userId,
      });
      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid rating data");
      }
      await this.physicianService.createRating(validationResult.data);
      sendSuccess(res, null, "Rating created successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getPhysicianRating(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { physicianId } = req.params;
      if (!physicianId) {
        throw new BadRequestError("Physician ID is required");
      }
      const rating = await this.physicianService.getPhysicianAverageRating(physicianId);
      sendSuccess(res, { rating }, "Rating retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Image upload endpoint using multer
  async uploadPhysicianImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
}

