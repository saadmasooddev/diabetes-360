import { db } from "../../../app/config/db";
import { medications, labReports } from "../models/medical.schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import type { InsertMedication, Medication, InsertLabReport, LabReport } from "../models/medical.schema";

export interface MedicineDosage {
  name: string,
  dosage?: string,
  frequency?: string,
  duration?: string,
  instructions?: string,
}

export class MedicalRepository {

  async createMedication(data: InsertMedication): Promise<Medication> {
    const [medication] = await db
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
    offset: number = 0
  ): Promise<Medication[]> {
    const results = await db
      .select()
      .from(medications)
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

  async getMedicationsByPhysicianAndDate(
    userId: string,
    physicianId: string,
    prescriptionDate: string
  ): Promise<Medication[]> {
  

    const results = await db
      .select()
      .from(medications)
      .where(
        and(
          eq(medications.userId, userId),
          eq(medications.physicianId, physicianId),
          gte(sql<Date>`DATE(${medications.prescriptionDate})`,prescriptionDate),
        )
      )
      .orderBy(desc(medications.prescriptionDate));
    
    return results;
  }

  async getMedicationById(medicationId: string, userId: string): Promise<Medication | null> {
    const [medication] = await db
      .select()
      .from(medications)
      .where(
        and(
          eq(medications.id, medicationId),
          eq(medications.userId, userId)
        )
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

  async getLabReportById(reportId: string, userId: string): Promise<LabReport | null> {
    const [report] = await db
      .select()
      .from(labReports)
      .where(
        and(
          eq(labReports.id, reportId),
          eq(labReports.userId, userId)
        )
      )
      .limit(1);
    
    return report || null;
  }

  async updateLabReport(
    reportId: string,
    userId: string,
    data: { fileName?: string; filePath?: string; fileSize?: string }
  ): Promise<LabReport> {
    const [updated] = await db
      .update(labReports)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(labReports.id, reportId),
          eq(labReports.userId, userId)
        )
      )
      .returning();
    
    if (!updated) {
      throw new Error("Lab report not found");
    }
    
    return updated;
  }

  async deleteLabReport(reportId: string, userId: string): Promise<void> {
    await db
      .delete(labReports)
      .where(
        and(
          eq(labReports.id, reportId),
          eq(labReports.userId, userId)
        )
      );
  }
}
