import { z } from "zod";
import { BookingService } from "../../booking/service/booking.service";
export enum COMMON_DATA_TYPES {
	SLOT_SIZES = "slotSizes",
	SLOT_TYPES = "slotTypes",
}

export const commonDataSchema = z.enum(Object.values(COMMON_DATA_TYPES));

export class CommonService {
	private bookingService: BookingService;

	constructor() {
		this.bookingService = new BookingService();
	}

	async getCommonData(requestdData: COMMON_DATA_TYPES[]) {
		const data = {
			slotsSizes: [],
			slotTypes: [],
		};
		if (requestdData.includes(COMMON_DATA_TYPES.SLOT_SIZES)) {
			data.slotsSizes = await this.bookingService.getAllSlotSizes();
		}

		if (requestdData.includes(COMMON_DATA_TYPES.SLOT_TYPES)) {
			data.slotTypes = await this.bookingService.getAllSlotTypes();
		}

		return data;
	}
}
