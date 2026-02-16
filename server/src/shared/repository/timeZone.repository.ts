import { timeZones } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "server/src/app/config/db";

export class TimeZoneRepository {
	async getTimeZone(tzName: string) {
		const tz = await db
			.select()
			.from(timeZones)
			.where(eq(timeZones.name, tzName));
		return tz[0];
	}

	async getTimeZones() {
		const tzs = await db.select().from(timeZones);
		return tzs;
	}

	async seedTimeZones(tzs: string[]) {
		await db.insert(timeZones).values(tzs.map((tz) => ({ name: tz })));
	}
}
