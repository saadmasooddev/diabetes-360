import { PhysicianRepository } from "../repository/physician.repository";
import type { 
  InsertPhysicianSpecialty, 
  UpdatePhysicianSpecialty,
  InsertPhysicianData,
  UpdatePhysicianData,
  InsertPhysicianRating,
} from "../../auth/models/user.schema";
import { BadRequestError, NotFoundError } from "../../../shared/errors";
import path from "path";

export class PhysicianService {
  private physicianRepository: PhysicianRepository;

  constructor() {
    this.physicianRepository = new PhysicianRepository();
  }

  // Specialty operations
  async getAllSpecialties() {
    return await this.physicianRepository.getAllSpecialties();
  }

  async getSpecialtyById(id: string) {
    const specialty = await this.physicianRepository.getSpecialtyById(id);
    if (!specialty) {
      throw new NotFoundError("Specialty not found");
    }
    return specialty;
  }

  async createSpecialty(data: InsertPhysicianSpecialty) {
    return await this.physicianRepository.createSpecialty(data);
  }

  async updateSpecialty(id: string, data: UpdatePhysicianSpecialty) {
    const existing = await this.physicianRepository.getSpecialtyById(id);
    if (!existing) {
      throw new NotFoundError("Specialty not found");
    }
    return await this.physicianRepository.updateSpecialty(id, data);
  }

  async deleteSpecialty(id: string) {
    const existing = await this.physicianRepository.getSpecialtyById(id);
    if (!existing) {
      throw new NotFoundError("Specialty not found");
    }
    await this.physicianRepository.deleteSpecialty(id);
  }

  // Physician data operations
  async getPhysicianDataByUserId(userId: string) {
    const data = await this.physicianRepository.getPhysicianDataByUserId(userId);
    if (!data) {
      throw new NotFoundError("Physician data not found");
    }
    return data;
  }

  async createPhysicianData(data: InsertPhysicianData) {
    // Check if physician data already exists
    const existing = await this.physicianRepository.getPhysicianDataByUserId(data.userId);
    if (existing) {
      throw new BadRequestError("Physician data already exists for this user");
    }
    
    this.validatePracticeStartDate(data.practiceStartDate?.toString() || '');
    
    return await this.physicianRepository.createPhysicianData(data);
  }


  async updatePhysicianData(userId: string, data: UpdatePhysicianData) {
    this.validatePracticeStartDate(data.practiceStartDate?.toString() || '');
    
    return await this.physicianRepository.updatePhysicianData(userId, data);
  }

  async deletePhysicianData(userId: string) {
    await this.physicianRepository.deletePhysicianData(userId);
  }

  // Consultation operations
  async getSpecialtiesForConsultation() {
    return await this.physicianRepository.getSpecialtiesForConsultation();
  }

  async getPhysiciansBySpecialty(specialtyId: string) {
    const specialty = await this.physicianRepository.getSpecialtyById(specialtyId);
    if (!specialty) {
      throw new NotFoundError("Specialty not found");
    }
    return await this.physicianRepository.getPhysiciansBySpecialty(specialtyId);
  }

  // Rating operations
  async createRating(data: InsertPhysicianRating) {
    // Check if customer has already rated this physician
    // For now, we'll allow multiple ratings (could be changed to one per customer)
    await this.physicianRepository.createRating(data);
  }

  async getPhysicianAverageRating(physicianId: string) {
    return await this.physicianRepository.getPhysicianAverageRating(physicianId);
  }

  
  async getImageUrlFromFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestError("File is required");
    }

    const relativePath = path.relative(
      path.join(process.cwd(), "public"),
      file.path
    );
    
    return relativePath;
  }

  async setImageUrlFromFile(path: string, userId: string){
    return await this.physicianRepository.setImageUrlFromFile(path, userId);
  }

  private validatePracticeStartDate(practiceStartDate: string) {
    const practiceDate = new Date(practiceStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (practiceDate > today) {
      throw new BadRequestError("Practice start date cannot be in the future");
    }
  }
 
}

