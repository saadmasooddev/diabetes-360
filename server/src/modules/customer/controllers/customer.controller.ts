import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { CustomerService } from "../service/customer.service";
import { BadRequestError } from "../../../shared/errors";
import {
	PAYMENT_TYPE,
	insertCustomerDataSchema,
	updateCustomerDataSchema,
} from "../../auth/models/user.schema";
import { handleError } from "../../../shared/middleware/errorHandler";
import { ConsultationQuotaRepository } from "../../booking/repository/consultation-quota.repository";
import { SettingsService } from "../../settings/service/settings.service";

export class CustomerController {
	private customerService: CustomerService;
	private consultationQuotaRepository: ConsultationQuotaRepository;
	private settingsService: SettingsService;

	constructor() {
		this.customerService = new CustomerService();
		this.consultationQuotaRepository = new ConsultationQuotaRepository();
		this.settingsService = new SettingsService();
	}

	async getCustomerData(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || req.params.userId;

			if (!userId) {
				throw new BadRequestError("User ID is required");
			}

			// Only allow users to access their own data unless admin
			if (req.user?.role !== "admin" && req.user?.userId !== userId) {
				throw new BadRequestError("Unauthorized to access this data");
			}

			const data = await this.customerService.getCustomerDataByUserId(userId);
			sendSuccess(
				res,
				{ profileData: data },
				"Customer data retrieved successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createCustomerData(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;

			if (!userId) {
				throw new BadRequestError("User ID is required");
			}

			const customerDataInput = { ...req.body };

			const validationResult =
				insertCustomerDataSchema.safeParse(customerDataInput);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			const data = await this.customerService.createCustomerData(
				userId,
				validationResult.data,
			);
			sendSuccess(res, { profileData: data }, "Profile completed successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async updateCustomerData(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || req.params.userId;

			if (!userId) {
				throw new BadRequestError("User ID is required");
			}

			// Only allow users to update their own data unless admin
			if (req.user?.role !== "admin" && req.user?.userId !== userId) {
				throw new BadRequestError("Unauthorized to update this data");
			}

			// Transform separate date fields to combined date fields if needed
			const customerDataInput = { ...req.body };

			const validationResult =
				updateCustomerDataSchema.safeParse(customerDataInput);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			const data = await this.customerService.updateCustomerData(
				userId,
				validationResult.data,
			);
			sendSuccess(
				res,
				{ profileData: data },
				"Customer data updated successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getConsultationQuotas(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;

			if (!userId) {
				throw new BadRequestError("User ID is required");
			}

			const user = await this.customerService.getCustomerDataByUserId(userId)
			const isFreeUser = user.paymentType === PAYMENT_TYPE.FREE
			if(isFreeUser) {
				const data = {
					quota: {
					discountedConsultationsUsed: 0,
					freeConsultationsUsed: 0,
					discountedConsultationsLeft: 0,
					freeConsultationsLeft: 0,
					discountedQuotaLimit: 0,
					freeQuotaLimit: 0,
				}
				} 
				sendSuccess(res, data, "Consultation quotas retrieved successfully");
				return
			}

			// Get user consultation quota
			const quota =
				await this.consultationQuotaRepository.getOrCreateUserConsultationQuota(
					userId,
				);

			// Get system-wide quota limits
			const systemLimits = await this.settingsService.getLogLimits();
			const discountedQuotaLimit =
				systemLimits.discountedConsultationQuota || 0;
			const freeQuotaLimit = systemLimits.freeConsultationQuota || 0;

			const data = {
				quota: {
					discountedConsultationsUsed: quota.discountedConsultationsUsed,
					freeConsultationsUsed: quota.freeConsultationsUsed,
					discountedConsultationsLeft: Math.max(
						0,
						discountedQuotaLimit - quota.discountedConsultationsUsed,
					),
					freeConsultationsLeft: Math.max(
						0,
						freeQuotaLimit - quota.freeConsultationsUsed,
					),
					discountedQuotaLimit,
					freeQuotaLimit,
				},
			}
			sendSuccess(
				res,
				data,
				"Consultation quotas retrieved successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}
}
