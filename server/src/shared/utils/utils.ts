import type { CustomerData } from "@shared/schema";
import { BadRequestError } from "../errors";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
dayjs.extend(timezone);

export class DateManager {
	static parseAndValidateDate(dateStr: string) {
		if (!dateStr || typeof dateStr !== "string") {
			throw new BadRequestError("Date is required (format: YYYY-MM-DD)");
		}
		if (Number.isNaN(new Date(dateStr).getTime())) {
			throw new BadRequestError("Invalid date.");
		}
		return dateStr;
	}
	static timeToMinutes(timeStr: string): number {
		const [hours, minutes] = timeStr.split(":").map(Number);
		return hours * 60 + minutes;
	}

	static date(date: string) {
		return dayjs(date).toDate();
	}
	static startOfDay(date: Date) {
		return dayjs(date).startOf("day").toDate();
	}

	static parseLocalDate(dateStr: string): Date {
		const parsed = dayjs(dateStr, "YYYY-MM-DD");
		if (!parsed.isValid()) {
			throw new BadRequestError(`Invalid date format: ${dateStr}`);
		}
		return parsed.toDate();
	}

	static formatDate(date: Date | string): string {
		return dayjs(date).format("YYYY-MM-DD");
	}

	static isToday(date: string) {
		const today = dayjs();
		const providedDate = dayjs(date);
		const isToday = providedDate.isSame(today, "day");
		return isToday;
	}

	static isBeforeToday(date: string) {
		const today = dayjs();
		const providedDate = dayjs(date);
		const isBeforeToday = providedDate.isBefore(today, "day");
		return isBeforeToday;
	}

	static getLocalTime(date: string | Date, timezone: string) {
		return dayjs.tz(date, timezone);
	}

	static getLocalHours(date: string | Date, timezone: string) {
		const d = this.getLocalTime(date, timezone);
		const localHours = d.hour() 
		return { localHours, date: d };
	}
}

export const formatUserInfo = (customerData: CustomerData) => {
	return {
		gender: customerData.gender,
		birthday: DateManager.formatDate(customerData.birthday),
		diagnosisDate: DateManager.formatDate(customerData.diagnosisDate),
		weight: `${customerData.weight}kg`,
		height: `${customerData.height}cm`,
		diabetesType: customerData.diabetesType,
	};
};

export const validateLimitAndOffset = (limit?: number, offset?: number) => {
	if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
		throw new BadRequestError("limit must be between 1 and 100");
	}
	if (offset !== undefined && (isNaN(offset) || offset < 0)) {
		throw new BadRequestError("offset must be a non-negative integer");
	}
};
