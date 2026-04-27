import { MedicalRepository } from "../repository/medical.repository";
import { BookingRepository } from "../../booking/repository/booking.repository";
import { NotFoundError, ForbiddenError } from "../../../shared/errors";
import type {
  InsertMedication,
  InsertLabReport,
} from "../models/medical.schema";
import path, { join, relative } from "path";
import fs from "fs";
import { PhysicianRepository } from "../../physician/repository/physician.repository";
import { UserRepository } from "../../user/repository/user.repository";
import { readdir } from "fs/promises";
import NotFound from "@/pages/not-found";
import { CHAT_ROLES, USER_ROLES, UserRole } from "@shared/schema";

export class MedicalService {
  private readonly medicalRepository: MedicalRepository;
  private readonly bookingRepository: BookingRepository;
  private readonly physicianRepository: PhysicianRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    this.medicalRepository = new MedicalRepository();
    this.bookingRepository = new BookingRepository();
    this.physicianRepository = new PhysicianRepository();
    this.userRepository = new UserRepository();
  }
  static LAB_REPORT_PATH = join("public", "uploads", "lab-reports");

  // Meications Methods
  async createMedication(
    userId: string,
    data: Omit<InsertMedication, "userId">,
  ): Promise<InsertMedication & { id: string }> {
    // Verify consultation exists and belongs to user
    const consultation = await this.bookingRepository.getBookedSlotById(
      data.consultationId,
    );
    if (!consultation || consultation.customerId !== userId) {
      throw new NotFoundError("Consultation not found");
    }

    const medication = await this.medicalRepository.createMedication({
      ...data,
      userId,
    });

    return medication;
  }

  async getMedicationsByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
    skip?: number,
  ) {
    const skipNumber = skip ? skip : offset;
    const [medications, total] = await Promise.all([
      this.medicalRepository.getMedicationsByUserId(userId, limit, skipNumber),
      this.medicalRepository.getMedicationsCountByUserId(userId),
    ]);

    const physicianIds = Array.from(
      new Set(medications.map((m) => m.physicianId)),
    );

    const physicianUsers =
      await this.userRepository.getAllUsersByIds(physicianIds);

    const physicianInfoRecords =
      await this.physicianRepository.getPhysicianByIds(physicianIds);

    const physicianMap = new Map(
      physicianUsers.map((u) => [
        u.id,
        {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          specialty:
            physicianInfoRecords.find((p) => p.userId === u.id)?.specialty ||
            null,
        },
      ]),
    );

    const enrichedMedications = medications.map((med) => ({
      ...med,
      physician: physicianMap.get(med.physicianId) || null,
    }));

    return {
      medications: enrichedMedications,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  async getMedicationsByPhysicianAndDate(
    userId: string,
    consultationId: string,
  ) {
    const medications =
      await this.medicalRepository.getMedicationByConsultationId(
        consultationId,
      );

    if (medications.length === 0) {
      throw new NotFoundError("Medications not found");
    }

    const physicianUser = await this.userRepository.getUser(
      medications[0].physicianId,
    );

    if (!physicianUser) {
      throw new NotFoundError("physician not found");
    }

    return {
      medications,
      physician: physicianUser
        ? {
            id: physicianUser.id,
            firstName: physicianUser.firstName,
            lastName: physicianUser.lastName,
            specialty: physicianUser.profileData?.speciality || null,
          }
        : null,
      prescriptionDate: medications.prescriptionDate,
    };
  }

  async uploadLabReport(
    userId: string,
    file: Express.Multer.File,
    metadata?: {
      reportName?: string;
      reportType?: string;
      dateOfReport?: string;
    },
  ): Promise<InsertLabReport & { id: string; uploadedAt: Date }> {
    const relativePath = this.getRelativePath(file.path);
    const report = await this.medicalRepository.createLabReport({
      userId,
      fileName: file.filename,
      filePath: relativePath,
      fileSize: file.size.toString(),
      reportName: metadata?.reportName,
      reportType: metadata?.reportType,
      dateOfReport: metadata?.dateOfReport,
    });

    return report;
  }

  async getLabReportsPaginated(
    userId: string,
    limit: number,
    offset: number,
    search?: string,
  ) {
    const userStoredReportsPath = path.join(
      process.cwd(),
      MedicalService.LAB_REPORT_PATH,
      userId,
    );

    if (!fs.existsSync(userStoredReportsPath)) {
      return {
        reports: [],
        total: 0,
      };
    }
    const result = await this.medicalRepository.getLabReportsPaginated(
      userId,
      limit,
      offset,
      search,
    );

    const userStoredReports = await readdir(userStoredReportsPath);
    const userStoredReportsDataSet = new Set(userStoredReports);
    const filteredReports = result.reports.filter((report) =>
      userStoredReportsDataSet.has(report.fileName),
    );
    return {
      reports: filteredReports,
      total: userStoredReports.length,
    };
  }

  async verifyPhysicianPatientAccess(
    physicianId: string,
    patientId: string,
  ): Promise<boolean> {
    return this.bookingRepository.hasPhysicianPatientRelationship(
      physicianId,
      patientId,
    );
  }

  async getLabReportsByUserId(userId: string) {
    const reports = await this.medicalRepository.getLabReportsByUserId(userId);
    const userStoredReportsPath = path.join(
      process.cwd(),
      MedicalService.LAB_REPORT_PATH,
      userId,
    );
    const userStoredReports = await readdir(userStoredReportsPath);
    const userStoredReportsDataSet = new Set(userStoredReports);
    const filteredReports = reports.filter((report) =>
      userStoredReportsDataSet.has(report.fileName),
    );
    return filteredReports;
  }

  async getLabReportById(reportId: string, userId: string) {
    const report = await this.medicalRepository.getLabReportById(
      reportId,
      userId,
    );
    if (!report) {
      throw new NotFoundError("Lab report not found");
    }
    return report;
  }

  async updateLabReport(
    reportId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const existingReport = await this.medicalRepository.getLabReportById(
      reportId,
      userId,
    );
    if (!existingReport) {
      throw new NotFoundError("Lab report not found");
    }

    const oldFilePath = path.join(process.cwd(), existingReport.filePath);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    const relativePath = this.getRelativePath(file.path);
    const updated = await this.medicalRepository.updateLabReport(
      reportId,
      userId,
      {
        fileName: file.filename,
        filePath: relativePath,
        fileSize: file.size.toString(),
      },
    );

    return updated;
  }

  async deleteLabReport(reportId: string, userId: string): Promise<void> {
    const report = await this.medicalRepository.getLabReportById(
      reportId,
      userId,
    );
    if (!report) {
      throw new NotFoundError("Lab report not found");
    }

    const filePath = path.join(process.cwd(), report.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.medicalRepository.deleteLabReport(reportId, userId);
  }

  async downloadLabReport(
    reportId: string,
    requesterId: string,
    role: UserRole,
  ): Promise<{ filePath: string; fileName: string }> {
    const report = await this.medicalRepository.getLabReportById(
      reportId,
      role === USER_ROLES.CUSTOMER ? requesterId : undefined,
    );
    if (!report) {
      throw new NotFoundError("Lab report not found");
    }
    if (role === USER_ROLES.PHYSICIAN) {
      const hasAccess = await this.verifyPhysicianPatientAccess(
        requesterId,
        report.userId,
      );
      if (!hasAccess) {
        throw new ForbiddenError(
          "You do not have access to this patient's lab reports",
        );
      }
    }

    const filePath = path.join(
      process.cwd(),
      MedicalService.LAB_REPORT_PATH,
      report.userId,
      report.fileName,
    );
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError("Lab report file not found");
    }

    return {
      filePath,
      fileName: report.fileName,
    };
  }

  private getRelativePath(filePath: string) {
    return relative(process.cwd(), filePath);
  }
}