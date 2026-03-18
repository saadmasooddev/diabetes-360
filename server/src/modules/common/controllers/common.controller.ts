import { BadRequestError } from "server/src/shared/errors";
import type { AuthenticatedRequest } from "server/src/shared/middleware/auth";
import {
	type COMMON_DATA_TYPES,
	CommonService,
	commonDataSchema,
} from "../service/common.service";
import { sendSuccess } from "server/src/app/utils/response";
import type { Response } from "express";
import { handleError } from "server/src/shared/middleware/errorHandler";

export class CommonController {
	private readonly commonService: CommonService;


	constructor() {
		this.commonService = new CommonService();
	}
	async getCommonData(req: AuthenticatedRequest, res: Response) {
		try {
			const { requestedData } = req.query;

			const requestedDataArray = JSON.parse(requestedData as string);
			if (
				!requestedData ||
				!Array.isArray(requestedDataArray) ||
				!requestedDataArray.every((item) => commonDataSchema.parse(item))
			) {
				throw new BadRequestError(
					"requestedData is required and must be an array",
				);
			}

			const data = await this.commonService.getCommonData(
				requestedData as COMMON_DATA_TYPES[],
			);
			sendSuccess(res, data, "Common Data retrived successfully");
		} catch (error) {
			handleError(res, error);
		}
	}


}
