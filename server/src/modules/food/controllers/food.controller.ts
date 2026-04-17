import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { FoodService } from "../service/food.service";
import {
	BadRequestError,
	ForbiddenError,
	ValidationError,
} from "../../../shared/errors";
import { handleError } from "../../../shared/middleware/errorHandler";
import { UserService } from "../../user/service/user.service";
import { SettingsService } from "../../settings/service/settings.service";
import type { CustomerData } from "../../auth/models/user.schema";
import { z } from "zod";
import { MEAL_TYPE_ENUM, insertLoggedMealSchema } from "../models/food.schema";
import { TimeZoneService } from "server/src/shared/services/timeZone.service";
import {
	DateManager,
	getPaginationParams,
} from "server/src/shared/utils/utils";

export class FoodController {
	private foodService: FoodService;
	private userService: UserService;
	private settingsService: SettingsService;
	private timeZoneService: TimeZoneService;

	constructor() {
		this.foodService = new FoodService();
		this.userService = new UserService();
		this.settingsService = new SettingsService();
		this.timeZoneService = new TimeZoneService();
	}

	async scanFood(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const file = req.file;
			const dateStr = req.body.date;
			const date = new Date(dateStr);

			if (!dateStr || isNaN(date.getTime()))
				throw new BadRequestError("Invalid date format");

			if (!file) {
				throw new BadRequestError("No image file provided");
			}

			const user = await this.userService.getProfile(userId);
			const profileData = user.user.profileData as unknown as CustomerData;
			const isPremium = user.user.paymentType !== "free";

			// Check if user can scan food today
			const scanStatus = await this.settingsService.getUserScanStatus(
				userId,
				isPremium,
			);
			if (!scanStatus.canScan) {
				throw new ForbiddenError(
					`Daily food scan limit reached. You have used ${scanStatus.currentCount} out of ${scanStatus.limit} scans today.`,
				);
			}

			// Process the image
			const result = await this.foodService.scanFoodImage(
				file.buffer,
				file.mimetype,
				isPremium,
				profileData,
				userId,
				dateStr,
			);

			// Increment scan count after successful scan
			await this.settingsService.incrementUserScanCount(userId);

			// Add can_scan_food flag to response
			const responseWithFlag = {
				...result,
				can_scan_food: scanStatus.currentCount + 1 < scanStatus.limit,
				remaining_scans: Math.max(
					0,
					scanStatus.limit - (scanStatus.currentCount + 1),
				),
			};

			sendSuccess(res, responseWithFlag, "Food scanned successfully");
		} catch (error: any) {
			console.log(error);
			handleError(res, error);
		}
	}

	async getPaidUserDailyData(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";

			const dateStr = req.query.date as string;
			if (!dateStr || isNaN(new Date(dateStr).getTime())) {
				throw new BadRequestError("Invalid date format");
			}
			const result = await this.foodService.getPaidUserDailyData(
				userId,
				dateStr,
			);
			sendSuccess(res, result, "Nutrition requirements retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getConsumedNutrients(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const date = req.query.date as string;
			if (!date || isNaN(new Date(date).getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const result = await this.foodService.getConsumedNutrients(userId, date);
			sendSuccess(res, result, "Consumed nutrients retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async generateRecipe(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const schema = z.object({
				name: z.string().min(1, "Meal name is required"),
				mealType: z.enum(Object.values(MEAL_TYPE_ENUM)),
				nutrition_info: z.object({
					carbs: z.number().nonnegative(),
					proteins: z.number().nonnegative(),
					calories: z.number().nonnegative(),
				}),
			});

			const body = schema.parse(req.body);

			const result = await this.foodService.generateRecipe(userId, body);
			sendSuccess(res, result, "Recipe generated successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async logMeal(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const dateStr = req.query.date as string;
			if (!dateStr || isNaN(new Date(dateStr).getTime())) {
				throw new BadRequestError("Invalid date format");
			}

			const timeZone = req.body?.timeZone;
			if (!timeZone || !Intl.supportedValuesOf("timeZone").includes(timeZone)) {
				throw new BadRequestError("Invalid timezone");
			}
			const tz = await this.timeZoneService.getTimeZone(timeZone);
			const body = insertLoggedMealSchema.safeParse({
				...req.body,
				mealDate: dateStr,
				userId,
			});
			if (!body.success) {
				throw new ValidationError(undefined, body.error);
			}

			const result = await this.foodService.logMeal(userId, body.data, dateStr);
			sendSuccess(res, result, "Meal logged successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getUserCalorieProfileBetweenDates(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				throw new BadRequestError("User not authenticated");
			}
			const startDate = (req.query.startDate as string)?.trim();
			const endDate = (req.query.endDate as string)?.trim();
			if (!startDate || isNaN(new Date(startDate).getTime())) {
				throw new BadRequestError("Valid startDate (YYYY-MM-DD) is required");
			}
			if (!endDate || isNaN(new Date(endDate).getTime())) {
				throw new BadRequestError("Valid endDate (YYYY-MM-DD) is required");
			}
			if (new Date(startDate) > new Date(endDate)) {
				throw new BadRequestError(
					"startDate must be before or equal to endDate",
				);
			}

			const { limit, offset, page } = getPaginationParams(req);

			const result = await this.foodService.getUserCalorieProfileBetweenDates(
				userId,
				startDate,
				endDate,
				limit,
				offset,
			);
			sendSuccess(res, result, "Calorie profile retrieved successfully");
		} catch (error) {
			handleError(res, error);
		}
	}
}
