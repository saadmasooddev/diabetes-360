import { Response, NextFunction } from "express";
import { type AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { CustomerService } from "../service/customer.service";
import { BadRequestError } from "../../../shared/errors";
import { 
  insertCustomerDataSchema,
  updateCustomerDataSchema,
} from "../../auth/models/user.schema";
import { handleError } from "../../../shared/middleware/errorHandler";

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  async getCustomerData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || req.params.userId;
      
      if (!userId) {
        
        throw new BadRequestError("User ID is required");
      }

      // Only allow users to access their own data unless admin
      if (req.user?.role !== 'admin' && req.user?.userId !== userId) {
        throw new BadRequestError("Unauthorized to access this data");
      }

      const data = await this.customerService.getCustomerDataByUserId(userId);
      sendSuccess(res, { customerData: data }, "Customer data retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async createCustomerData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new BadRequestError("User ID is required");
      }

      const customerDataInput = { ...req.body };

      const validationResult = insertCustomerDataSchema.safeParse(customerDataInput);
      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid customer data");
      }

      const data = await this.customerService.createCustomerData(userId, validationResult.data);
      sendSuccess(res, { customerData: data }, "Profile completed successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateCustomerData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || req.params.userId;
      
      if (!userId) {
        throw new BadRequestError("User ID is required");
      }

      // Only allow users to update their own data unless admin
      if (req.user?.role !== 'admin' && req.user?.userId !== userId) {
        throw new BadRequestError("Unauthorized to update this data");
      }

      // Transform separate date fields to combined date fields if needed
      const customerDataInput = { ...req.body };
      
      const validationResult = updateCustomerDataSchema.safeParse(customerDataInput);
      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid customer data");
      }

      const data = await this.customerService.updateCustomerData(userId, validationResult.data);
      sendSuccess(res, { customerData: data }, "Customer data updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

