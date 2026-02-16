import { NotFoundError } from "../errors/AppError";
import { TimeZoneRepository } from "../repository/timeZone.repository";

export class TimeZoneService {
	timeZoneRepository: TimeZoneRepository;
	constructor() {
		this.timeZoneRepository = new TimeZoneRepository();
	}
	async getTimeZone(tzName: string) {
		const tz = await this.timeZoneRepository.getTimeZone(tzName);
		if (!tz) {
			throw new NotFoundError("Timezone not found");
		}
		return tz;
	}
}
