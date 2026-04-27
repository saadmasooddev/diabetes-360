import { sql } from "drizzle-orm";
import {
	pgTable,
	varchar,
	timestamp,
	text,
	jsonb,
	date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";
import { bookedSlots } from "../../booking/models/booking.schema";
import type { MedicineDosage } from "../repository/medical.repository";

// Medications Table - stores prescriptions from consultations
export const medications = pgTable("medications", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	consultationId: varchar("consultation_id")
		.notNull()
		.references(() => bookedSlots.id, { onDelete: "cascade" }),
	physicianId: varchar("physician_id")
		.notNull()
		.references(() => users.id, { onDelete: "restrict" }),
	prescriptionDate: timestamp("prescription_date", {
		withTimezone: true,
	}).notNull(),
	medicines: jsonb("medicines").$type<MedicineDosage[]>().notNull(), // Array of medicine objects
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

// Lab Reports Table - stores uploaded PDF lab reports
export const labReports = pgTable("lab_reports", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	fileName: text("file_name").notNull(), // Original filename
	filePath: text("file_path").notNull(), // Path to stored file
	fileSize: text("file_size").notNull(), // File size in bytes
	reportName: text("report_name"), // User-provided report name
	reportType: varchar("report_type"), // blood_test, xray, ecg, prescription, mri_ct, other
	dateOfReport: date("date_of_report"), // Date of the report
	uploadedAt: timestamp("uploaded_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const medicineSchema = z.object({
	name: z.string().min(1),
	dosage: z.string().optional(),
	frequency: z.string().optional(),
	duration: z.string().optional(),
	instructions: z.string().optional(),
})

// Validation schemas
export const insertMedicationSchema = createInsertSchema(medications)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		userId: z.string().min(1),
		consultationId: z.string().min(1),
		physicianId: z.string().min(1),
		prescriptionDate: z.coerce.date(),
		medicines: z.array(
			medicineSchema
		),
	});

export const insertLabReportSchema = createInsertSchema(labReports)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		userId: z.string().min(1),
		fileName: z.string().min(1),
		filePath: z.string().min(1),
		fileSize: z.string().min(1),
		reportName: z.string().optional(),
		reportType: z.string().optional(),
		dateOfReport: z.string().optional(),
	});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertLabReport = z.infer<typeof insertLabReportSchema>;
export type LabReport = typeof labReports.$inferSelect;