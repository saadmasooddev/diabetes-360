import { db } from "../../../app/config/db";
import { medications, labReports } from "../models/medical.schema";
import { eq, desc, and, gte, lte, sql, getTableColumns } from "drizzle-orm";
import type {
	InsertMedication,
	Medication,
	InsertLabReport,
	LabReport,
} from "../models/medical.schema";
import { Tx } from "../../food/models/food.schema";
import {
	availabilityDate,
	bookedSlots,
	slots,
} from "../../booking/models/booking.schema";

export interface MedicineDosage {
	name: string;
	dosage?: string;
	frequency?: string;
	duration?: string;
	instructions?: string;
}

export class MedicalRepository {
	async createMedication(data: InsertMedication, tx?: Tx): Promise<Medication> {
		const dbConn = tx || db;
		const medicationsFound = await this.getMedicationByConsultationId(
			data.consultationId,
			tx,
		);
		if (medicationsFound.length > 0) {
			const updateData = {
				userId: data.userId,
				consultationId: data.consultationId,
				physicianId: data.physicianId,
				prescriptionDate: data.prescriptionDate,
				medicines: data.medicines,
				updatedAt: new Date(),
			};
			const [updated] = await dbConn
				.update(medications)
				.set(updateData)
				.where(eq(medications.id, medicationsFound[0].id))
				.returning();
			return updated;
		}
		const [medication] = await dbConn
			.insert(medications)
			.values({
				userId: data.userId,
				consultationId: data.consultationId,
				physicianId: data.physicianId,
				prescriptionDate: data.prescriptionDate,
				medicines: data.medicines,
			})
			.returning();

		return medication;
	}

	async getMedicationsByUserId(
		userId: string,
		limit: number = 10,
		offset: number = 0,
	): Promise<Medication[]> {
		const results = await db
			.select({
				...getTableColumns(medications),
				consultation: {
					date: availabilityDate.date,
					startTime: slots.startTime,
				},
			})
			.from(medications)
			.innerJoin(bookedSlots, eq(medications.consultationId, bookedSlots.id))
			.innerJoin(slots, eq(bookedSlots.slotId, slots.id))
			.innerJoin(
				availabilityDate,
				eq(availabilityDate.id, slots.availabilityId),
			)
			.where(eq(medications.userId, userId))
			.orderBy(desc(medications.prescriptionDate))
			.limit(limit)
			.offset(offset);

		return results;
	}

	async getMedicationsCountByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: medications.id })
			.from(medications)
			.where(eq(medications.userId, userId));

		return result.length;
	}

	async getMedicationByConsultationId(consultationId: string, tx?: Tx) {
		const dbConn = tx || db;
		const med = await dbConn
			.select()
			.from(medications)
			.where(eq(medications.consultationId, consultationId));
		return med || null;
	}

	async getMedicationsByPhysicianAndDate(
		userId: string,
		physicianId: string,
		prescriptionDate: string,
	): Promise<Medication[]> {
		const results = await db
			.select()
			.from(medications)
			.where(
				and(
					eq(medications.userId, userId),
					eq(medications.physicianId, physicianId),
					gte(
						sql<Date>`DATE(${medications.prescriptionDate})`,
						prescriptionDate,
					),
				),
			)
			.orderBy(desc(medications.prescriptionDate));

		return results;
	}

	async getMedicationById(
		medicationId: string,
		userId: string,
	): Promise<Medication | null> {
		const [medication] = await db
			.select()
			.from(medications)
			.where(
				and(eq(medications.id, medicationId), eq(medications.userId, userId)),
			)
			.limit(1);

		return medication || null;
	}

	// Lab Reports Methods
	async createLabReport(data: InsertLabReport): Promise<LabReport> {
		const [report] = await db
			.insert(labReports)
			.values({
				userId: data.userId,
				fileName: data.fileName,
				filePath: data.filePath,
				fileSize: data.fileSize,
				reportName: data.reportName ?? null,
				reportType: data.reportType ?? null,
				dateOfReport: data.dateOfReport,
			})
			.returning();

		return report;
	}

	async getLabReportsByUserId(userId: string): Promise<LabReport[]> {
		const results = await db
			.select()
			.from(labReports)
			.where(eq(labReports.userId, userId))
			.orderBy(desc(labReports.uploadedAt));

		return results;
	}

	async getLabReportsPaginated(
		userId: string,
		limit: number,
		offset: number,
		search?: string,
	): Promise<{ reports: LabReport[]; total: number }> {
		const baseConditions = [eq(labReports.userId, userId)];
		if (search && search.trim()) {
			const searchPattern = `%${search.trim()}%`;
			baseConditions.push(
				sql`(${labReports.reportName} ILIKE ${searchPattern} OR ${labReports.fileName} ILIKE ${searchPattern})` as any,
			);
		}
		const whereClause = and(...baseConditions);

		const [reports, countResult] = await Promise.all([
			db
				.select()
				.from(labReports)
				.where(whereClause)
				.orderBy(desc(labReports.uploadedAt))
				.limit(limit)
				.offset(offset),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(labReports)
				.where(whereClause),
		]);

		return {
			reports,
			total: countResult[0]?.count ?? 0,
		};
	}

	async getLabReportById(
		reportId: string,
		userId?: string,
	): Promise<LabReport | null> {
		const conditions = [eq(labReports.id, reportId)];
		if (userId) {
			conditions.push(eq(labReports.userId, userId));
		}

		const [report] = await db
			.select()
			.from(labReports)
			.where(and(...conditions))
			.limit(1);

		return report || null;
	}

	async updateLabReport(
		reportId: string,
		userId: string,
		data: { fileName?: string; filePath?: string; fileSize?: string },
	): Promise<LabReport> {
		const [updated] = await db
			.update(labReports)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(and(eq(labReports.id, reportId), eq(labReports.userId, userId)))
			.returning();

		if (!updated) {
			throw new Error("Lab report not found");
		}

		return updated;
	}

	async deleteLabReport(reportId: string, userId: string): Promise<void> {
		await db
			.delete(labReports)
			.where(and(eq(labReports.id, reportId), eq(labReports.userId, userId)));
	}
}
