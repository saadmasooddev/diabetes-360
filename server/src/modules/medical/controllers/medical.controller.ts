import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { MedicalService } from "../service/medical.service";
import { BadRequestError, ForbiddenError, ValidationError } from "../../../shared/errors";
import {
  PERMISSIONS,
  USER_ROLES,
  UserRole,
} from "../../auth/models/user.schema";
import { handleError } from "../../../shared/middleware/errorHandler";
import { getLabReportAzureUploadUrlSchema, insertMedicationSchema } from "../models/medical.schema";
import { getPaginationParams } from "server/src/shared/utils/utils";

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

      const { limit, offset } = getPaginationParams(req);

      const result = await this.medicalService.getMedicationsByUserId(
        userId,
        limit,
        offset,
        offset,
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

      const { consultationId } = req.query;

      if (!consultationId) {
        throw new BadRequestError(
          "physicianId and prescriptionDate are required",
        );
      }

      const result = await this.medicalService.getMedicationsByPhysicianAndDate(
        userId,
        consultationId as string,
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

      const report = await this.medicalService.uploadLabReport(
        userId,
        req.file,
        {
          reportName: reportName || undefined,
          reportType: reportType || undefined,
          dateOfReport: dateOfReport || undefined,
        },
      );
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

      const isAdmin = permissions.includes(
        PERMISSIONS.READ_ALL_MEDICAL_RECORDS,
      );
      const isPhysician = permissions.includes(
        PERMISSIONS.READ_PATIENT_MEDICAL_RECORDS,
      );

      if (!isAdmin && !isPhysician) {
        throw new ForbiddenError(
          "Access denied. Physician or admin permission required.",
        );
      }

      if (isPhysician && !isAdmin) {
        const hasAccess =
          await this.medicalService.verifyPhysicianPatientAccess(
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

  async getLabReportAzureUploadUrl(req:AuthenticatedRequest, res: Response){
    try {
       
      const userId = req?.user?.userId
      const validatedResult = getLabReportAzureUploadUrlSchema.safeParse(req.body) 
      if(!validatedResult.success){
        throw new ValidationError(undefined, validatedResult.error)
      }

      const response =await this.medicalService.getLabReportAzureUploadUrl(userId!, validatedResult.data)
      sendSuccess(res, response, "Lab report upload url generated successfully")

    } catch (error) {
      handleError(res, error)
      
    }
  }

  async  confirmLabReport(req:AuthenticatedRequest, res:Response) {
    try {
      const userId = req.user?.userId
      if(!userId) {
        throw new BadRequestError("User ID not found")
      }

      const reportId = req.params.id
      if(!reportId) {
        throw new BadRequestError("Report ID is required")
      }

      const report = await this.medicalService.confirmLabReport(reportId, userId)
      sendSuccess(res, report, "Lab report confirmed successfully")
      
    } catch (error) {
      handleError(res, error)
      
    }

  }

  async getDownloadLabReportUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const requesterId = req.user?.userId;
      const permissions = req.user?.permissions || [];
      if (!requesterId) {
        throw new BadRequestError("User ID not found");
      }

      const reportId = req.params.id;
      if (!reportId) {
        throw new BadRequestError("Report ID is required");
      }

      let role: UserRole = USER_ROLES.CUSTOMER;
      if (permissions.includes(PERMISSIONS.READ_ALL_MEDICAL_RECORDS)) {
        role = USER_ROLES.ADMIN;
      } else if (
        permissions.includes(PERMISSIONS.READ_PATIENT_MEDICAL_RECORDS)
      ) {
        role = USER_ROLES.PHYSICIAN;
      }

      const response = await this.medicalService.getDownloadLabReportUrl(
        reportId,
        requesterId,
        role,
      );
      sendSuccess(res, response, "Lab report download url generated successfully");
    } catch (error) {
      handleError(res, error);
    }
  } 

  async deletelabReportAzureFile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId
      if(!userId) {
        throw new BadRequestError("User ID not found")
      }

      const reportId = req.params.id
      if(!reportId) {
        throw new BadRequestError("Report ID is required")
      }

      await this.medicalService.deleteLabReportAzureFile(reportId, userId);
      sendSuccess(res, null, "Lab report deleted successfully");
    } catch (error) {
      handleError(res, error);
    }
  }
}
