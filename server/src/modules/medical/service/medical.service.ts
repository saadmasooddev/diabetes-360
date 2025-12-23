import { MedicalRepository } from "../repository/medical.repository";
import { NotFoundError } from "../../../shared/errors";
import type { InsertMedication, InsertLabReport } from "../models/medical.schema";
import { BookingRepository } from "../../booking/repository/booking.repository";
import path, { join, relative } from "path";
import fs from "fs";
import { PhysicianRepository } from "../../physician/repository/physician.repository";
import { UserRepository } from "../../user/repository/user.repository";

export class MedicalService {
  private readonly medicalRepository: MedicalRepository;
  private readonly bookingRepository: BookingRepository;
  private readonly physicianRepository: PhysicianRepository;
  private readonly userRepository: UserRepository

  constructor() {
    this.medicalRepository = new MedicalRepository();
    this.bookingRepository = new BookingRepository();
    this.physicianRepository = new PhysicianRepository()
    this.userRepository = new UserRepository()
  }
  static LAB_REPORT_PATH = join('public', 'uploads', 'lab-reports')

  // Meications Methods
  async createMedication(userId: string, data: Omit<InsertMedication, "userId">): Promise<InsertMedication & { id: string }> {
    // Verify consultation exists and belongs to user
    const consultation = await this.bookingRepository.getBookedSlotById(data.consultationId);
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
    skip?: number
  ) {
    const skipNumber = skip ? skip: offset
    const [medications, total] = await Promise.all([
      this.medicalRepository.getMedicationsByUserId(userId, limit, skipNumber),
      this.medicalRepository.getMedicationsCountByUserId(userId),
    ]);

    
    const physicianIds = Array.from(new Set(medications.map(m => m.physicianId)));
    
    const physicianUsers = await this.userRepository.getAllUsersByIds(physicianIds) 

    const physicianInfoRecords = await this.physicianRepository.getPhysicianByIds(physicianIds) 

    const physicianMap = new Map(
      physicianUsers.map(u => [
        u.id,
        {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          specialty: physicianInfoRecords.find(p => p.userId === u.id)?.specialty || null,
        }
      ])
    );

    const enrichedMedications = medications.map(med => ({
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
    physicianId: string,
    prescriptionDate: string
  ) {

    const physicianUser = await this.userRepository.getUser(physicianId) 

    if(!physicianUser) {
      throw new NotFoundError("physician not found")
    }

    const date = new Date(prescriptionDate);
    const medications = await this.medicalRepository.getMedicationsByPhysicianAndDate(
      userId,
      physicianId,
      date
    );

    
    return {
      medications,
      physician: physicianUser ? {
        id: physicianUser.id,
        firstName: physicianUser.firstName,
        lastName: physicianUser.lastName,
        specialty: physicianUser.profileData?.speciality || null,
      } : null,
      prescriptionDate: date.toISOString(),
    };
  }

  async uploadLabReport(
    userId: string,
    file: Express.Multer.File
  ): Promise<InsertLabReport & { id: string; uploadedAt: Date }> {
    const relativePath = this.getRelativePath(file.path)
    const report = await this.medicalRepository.createLabReport({
      userId,
      fileName: file.originalname,
      filePath: relativePath,
      fileSize: file.size.toString(),
    });

    return report;
  }

  async getLabReportsByUserId(userId: string) {
    return await this.medicalRepository.getLabReportsByUserId(userId);
  }

  async getLabReportById(reportId: string, userId: string) {
    const report = await this.medicalRepository.getLabReportById(reportId, userId);
    if (!report) {
      throw new NotFoundError("Lab report not found");
    }
    return report;
  }

  async updateLabReport(
    reportId: string,
    userId: string,
    file: Express.Multer.File
  ) {
    const existingReport = await this.medicalRepository.getLabReportById(reportId, userId);
    if (!existingReport) {
      throw new NotFoundError("Lab report not found");
    }

    const oldFilePath = path.join(process.cwd(), existingReport.filePath);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    const relativePath = this.getRelativePath(file.path)
    const updated = await this.medicalRepository.updateLabReport(reportId, userId, {
      fileName: file.originalname,
      filePath: relativePath, 
      fileSize: file.size.toString(),
    });

    return updated;
  }

  async deleteLabReport(reportId: string, userId: string): Promise<void> {
    const report = await this.medicalRepository.getLabReportById(reportId, userId);
    if (!report) {
      throw new NotFoundError("Lab report not found");
    }

    const filePath = path.join(process.cwd(), report.filePath);
    console.log("The file path is")
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.medicalRepository.deleteLabReport(reportId, userId);
  }

  async downloadLabReport(reportId: string, userId: string): Promise<{ filePath: string; fileName: string }> {
    const report = await this.medicalRepository.getLabReportById(reportId, userId);
    if (!report) {
      throw new NotFoundError("Lab report not found");
    }

    const filePath = path.join(process.cwd(), report.filePath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError("Lab report file not found");
    }

    return {
      filePath,
      fileName: report.fileName,
    };
  }

  private getRelativePath(filePath: string){
    return relative(process.cwd(), filePath)
  }

}
