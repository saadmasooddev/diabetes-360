import { type Request, Response, NextFunction } from "express";
import { insertUserSchema, type InsertUser, insertPhysicianDataSchema, updatePhysicianDataSchema } from "../../auth/models/user.schema";
import { AuthService } from "../../auth/services/auth.service";
import { PhysicianService } from "../../physician/service/physician.service";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../../../app/constants";
import { sendSuccess } from "../../../app/utils/response";
import { BadRequestError, NotFoundError } from "../../../shared/errors";
import { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { USER_ROLES } from "../../../shared/constants/roles";
import { handleError } from "../../../shared/middleware/errorHandler";

export class AdminController {
  private authService: AuthService;
  private physicianService: PhysicianService;

  constructor() {
    this.authService = new AuthService();
    this.physicianService = new PhysicianService();
  }

  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // This would need to be implemented in the repository
      // For now, we'll return a placeholder
      const users = await this.authService.getAllUsers();
      
      sendSuccess(res, { users }, "Users retrieved successfully");
    } catch (error: any) {
      handleError(res, error,  { users: []});
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new BadRequestError("User ID is required");
      }

      const user = await this.authService.getUserById(id);
      
      if (!user) {
        throw new NotFoundError("User not found");
      }

      sendSuccess(res, { user }, "User retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse({
        username: req.body.email,
        fullName: req.body.fullName,
        password: req.body.password,
        email: req.body.email,
        provider: "manual",
        role: req.body.role || USER_ROLES.CUSTOMER,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      });

      const authResponse = await this.authService.signup(validatedData);

      // If user is a physician, create physician data
      if (authResponse.user.role === USER_ROLES.PHYSICIAN && req.body.physicianData) {
        try {
          const physicianDataValidation = insertPhysicianDataSchema.safeParse({
            userId: authResponse.user.id,
            specialtyId: req.body.physicianData.specialtyId,
            practiceStartDate: new Date(req.body.physicianData.practiceStartDate),
            consultationFee: req.body.physicianData.consultationFee,
            imageUrl: req.body.physicianData.imageUrl || null,
          });

          if (physicianDataValidation.success) {
            await this.physicianService.createPhysicianData(physicianDataValidation.data);
          }
        } catch (physicianError) {
          // Log error but don't fail user creation
          console.error("Error creating physician data:", physicianError);
        }
      }

      sendSuccess(res, {
        user: authResponse.user,
        tokens: authResponse.tokens,
      }, SUCCESS_MESSAGES.ACCOUNT_CREATED);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        throw new BadRequestError("User ID is required");
      }

      const user = await this.authService.updateUser(id, updateData);

      // If user is a physician and physicianData is provided, update it
      if (user.role === USER_ROLES.PHYSICIAN && req.body.physicianData) {
        try {
          const physicianDataValidation = updatePhysicianDataSchema.safeParse({
            specialtyId: req.body.physicianData.specialtyId,
            practiceStartDate: new Date(req.body.physicianData.practiceStartDate),
            consultationFee: req.body.physicianData.consultationFee,
            imageUrl: req.body.physicianData.imageUrl,
          });

          if (physicianDataValidation.success) {
            // Check if physician data exists
            await this.physicianService.updatePhysicianData(id, physicianDataValidation.data);
          } 
        } catch (physicianError: any) {
          console.error("Error updating physician data:", physicianError);
        }
      }

      sendSuccess(res, { user }, "User updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("User ID is required");
      }

      // Prevent admin from deleting themselves
      if (id === req.user?.userId) {
        throw new BadRequestError("Cannot delete your own account");
      }

      await this.authService.deleteUser(id);

      sendSuccess(res, null, "User deleted successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!id) {
        throw new BadRequestError("User ID is required");
      }

      // Prevent admin from deactivating themselves
      if (id === req.user?.userId && isActive === false) {
        throw new BadRequestError("Cannot deactivate your own account");
      }

      const user = await this.authService.updateUser(id, { isActive });

      sendSuccess(res, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      handleError(res, error);
    }
  }
}
