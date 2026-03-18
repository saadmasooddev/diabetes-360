import type { CustomerData } from "@shared/schema";
import { BadRequestError } from "../errors";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { Request } from "express";
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
		const localHours = d.hour();
		return { localHours, date: d, utcDate: d.utc().toISOString() };
	}

	/**
	 * Builds an ISO 8601 start time from an availability date and a time string (HH:MM or HH:MM:SS).
	 * Treats the combined date+time as UTC.
	 */
	static slotTimeToISO(date: Date | string, timeStr: string, timeZone = "Asia/Karachi"): string {
		const datePart = dayjs(date).utc().format("YYYY-MM-DD");
		const normalized = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
		const dateTime = `${datePart} ${normalized}`
		return this.getLocalHours(dateTime, timeZone).date.toISOString()
	}
}

export const formatUserInfo = (customerData: CustomerData & { firstName?: string; lastName?: string}) => {
	return {
		name: customerData.lastName && customerData.firstName ? `${customerData.firstName} ${customerData.lastName}` : "User",
		gender: customerData.gender,
		birthday: DateManager.formatDate(customerData.birthday),
		weight: `${customerData.weight}kg`,
		height: `${customerData.height}cm`,
		diabetesType: customerData.diabetesType,
	};
};

export const getPaginationParams = (req: Request) => {
	const queryPage = parseInt(req.query.page as string, 10)
	const queryLimit = parseInt(req.query.limit as string, 10)
	const querySkip = parseInt(req.query.skip as string, 10);
	const queryOffset = parseInt(req.query.offset as string, 10)
	const queryTake = parseInt(req.query.take as string, 10)

	const page = req.query.page ? queryPage : 1;
	let limit: number | undefined = undefined

	if(queryLimit){
		limit = queryLimit
	}
	if(queryTake){
		limit = queryTake
	}

	let offset = 0
	if(queryPage && limit) {
		offset = (queryPage - 1) * limit
	}
	else if(querySkip) {
		offset = querySkip
	}
	else if(queryOffset){
		offset = queryOffset
	}

	if(page < 1) {
		throw new BadRequestError("page must be greater than 0")
	}
	if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
		throw new BadRequestError("limit must be between 1 and 100");
	}
	if (offset !== undefined && (isNaN(offset) || offset < 0)) {
		throw new BadRequestError("offset must be a non-negative integer");
	}


	return { limit, offset, page}
};


export const ALLOWED_TYPES = {
		'image/jpeg': { maxSize: 10 * 1024 * 1024, ext: 'jpg' },     // 10MB
		'image/png': { maxSize: 10 * 1024 * 1024, ext: 'png' },      // 10MB
		'image/webp': { maxSize: 5 * 1024 * 1024, ext: 'webp' },     // 5MB
		'application/pdf': { maxSize: 50 * 1024 * 1024, ext: 'pdf' }, // 50MB
	};