import { db } from "../../../app/config/db";
import { eq, and, avg, sql } from "drizzle-orm";
import { 
  physicianSpecialties, 
  physicianData, 
  physicianRatings, 
  users 
} from "../../auth/models/user.schema";
import type { 
  InsertPhysicianSpecialty, 
  UpdatePhysicianSpecialty, 
  PhysicianSpecialty,
  InsertPhysicianData,
  UpdatePhysicianData,
  PhysicianData,
  InsertPhysicianRating,
} from "../../auth/models/user.schema";
import { USER_ROLES } from "../../../shared/constants/roles";

export class PhysicianRepository {
  // Specialty CRUD operations
  async getAllSpecialties(): Promise<PhysicianSpecialty[]> {
    return await db
      .select()
      .from(physicianSpecialties)
      .where(eq(physicianSpecialties.isActive, true))
      .orderBy(physicianSpecialties.name);
  }

  async getSpecialtyById(id: string): Promise<PhysicianSpecialty | null> {
    const [specialty] = await db
      .select()
      .from(physicianSpecialties)
      .where(eq(physicianSpecialties.id, id))
      .limit(1);
    
    return specialty || null;
  }

  async createSpecialty(data: InsertPhysicianSpecialty): Promise<PhysicianSpecialty> {
    const [specialty] = await db
      .insert(physicianSpecialties)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    
    return specialty;
  }

  async updateSpecialty(id: string, data: UpdatePhysicianSpecialty): Promise<PhysicianSpecialty> {
    const [specialty] = await db
      .update(physicianSpecialties)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(physicianSpecialties.id, id))
      .returning();
    
    if (!specialty) {
      throw new Error("Specialty not found");
    }
    
    return specialty;
  }

  async deleteSpecialty(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await db
      .update(physicianSpecialties)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(physicianSpecialties.id, id));
  }

  // Physician Data operations
  async getPhysicianDataByUserId(userId: string): Promise<PhysicianData | null> {
    const [data] = await db
      .select()
      .from(physicianData)
      .where(eq(physicianData.userId, userId))
      .limit(1);
    
    return data || null;
  }

  async createPhysicianData(data: InsertPhysicianData): Promise<PhysicianData> {
    const [physicianDataRecord] = await db
      .insert(physicianData)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    
    return physicianDataRecord;
  }

  async updatePhysicianData(userId: string, data: UpdatePhysicianData): Promise<PhysicianData> {
    const [physicianDataRecord] = await db
      .update(physicianData)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(physicianData.userId, userId))
      .returning();
    
    if (!physicianDataRecord) {
      throw new Error("Physician data not found");
    }
    
    return physicianDataRecord;
  }

  async deletePhysicianData(userId: string): Promise<void> {
    await db
      .delete(physicianData)
      .where(eq(physicianData.userId, userId));
  }

  // Get all physicians for consultation
  async getAllPhysicians() {
    const physicians = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        isActive: users.isActive,
        specialtyId: physicianData.specialtyId,
        practiceStartDate: physicianData.practiceStartDate,
        consultationFee: physicianData.consultationFee,
        imageUrl: physicianData.imageUrl,
        specialty: physicianSpecialties.name,
      })
      .from(users)
      .innerJoin(physicianData, eq(users.id, physicianData.userId))
      .innerJoin(physicianSpecialties, eq(physicianData.specialtyId, physicianSpecialties.id))
      .where(
        and(
          eq(users.role, USER_ROLES.PHYSICIAN),
          eq(users.isActive, true)
        )
      );

    // Get average ratings for each physician
    const physiciansWithRatings = await Promise.all(
      physicians.map(async (physician) => {
        const [avgRating] = await db
          .select({
            averageRating: avg(physicianRatings.rating),
            totalRatings: sql<number>`count(${physicianRatings.id})`,
          })
          .from(physicianRatings)
          .where(eq(physicianRatings.physicianId, physician.id));

        const rating = avgRating?.averageRating 
          ? parseFloat(avgRating.averageRating.toString()) 
          : 0;
        const totalRatings = avgRating?.totalRatings ? parseInt(avgRating.totalRatings.toString()) : 0;

        // Calculate years of experience
        const startDate = new Date(physician.practiceStartDate);
        const now = new Date();
        const yearsExperience = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        );

        return {
          ...physician,
          rating: rating,
          totalRatings: totalRatings,
          experience: `${yearsExperience}+ years`,
        };
      })
    );

    return physiciansWithRatings;
  }

  // Get physicians by specialty for consultation
  async getPhysiciansBySpecialty(specialtyId: string) {
    const physicians = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        isActive: users.isActive,
        specialtyId: physicianData.specialtyId,
        practiceStartDate: physicianData.practiceStartDate,
        consultationFee: physicianData.consultationFee,
        imageUrl: physicianData.imageUrl,
        specialty: physicianSpecialties.name,
      })
      .from(users)
      .innerJoin(physicianData, eq(users.id, physicianData.userId))
      .innerJoin(physicianSpecialties, eq(physicianData.specialtyId, physicianSpecialties.id))
      .where(
        and(
          eq(physicianData.specialtyId, specialtyId),
          eq(users.role, USER_ROLES.PHYSICIAN),
          eq(users.isActive, true)
        )
      );

    // Get average ratings for each physician
    const physiciansWithRatings = await Promise.all(
      physicians.map(async (physician) => {
        const [avgRating] = await db
          .select({
            averageRating: avg(physicianRatings.rating),
            totalRatings: sql<number>`count(${physicianRatings.id})`,
          })
          .from(physicianRatings)
          .where(eq(physicianRatings.physicianId, physician.id));

        const rating = avgRating?.averageRating 
          ? parseFloat(avgRating.averageRating.toString()) 
          : 0;
        const totalRatings = avgRating?.totalRatings ? parseInt(avgRating.totalRatings.toString()) : 0;

        // Calculate years of experience
        const startDate = new Date(physician.practiceStartDate);
        const now = new Date();
        const yearsExperience = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        );

        return {
          ...physician,
          rating: rating,
          totalRatings: totalRatings,
          experience: `${yearsExperience}+ years`,
        };
      })
    );

    return physiciansWithRatings;
  }

  // Get all specialties for consultation page
  async getSpecialtiesForConsultation() {
    return await db
      .select({
        id: physicianSpecialties.id,
        name: physicianSpecialties.name,
        specialty: physicianSpecialties.name,
        icon: physicianSpecialties.icon,
      })
      .from(physicianSpecialties)
      .where(eq(physicianSpecialties.isActive, true))
      .orderBy(physicianSpecialties.name);
  }

  // Rating operations
  async createRating(data: InsertPhysicianRating): Promise<void> {
    await db.insert(physicianRatings).values({
      ...data,
      updatedAt: new Date(),
    });
  }

  async getPhysicianAverageRating(physicianId: string): Promise<{ averageRating: number; totalRatings: number }> {
    const [result] = await db
      .select({
        averageRating: avg(physicianRatings.rating),
        totalRatings: sql<number>`count(${physicianRatings.id})`,
      })
      .from(physicianRatings)
      .where(eq(physicianRatings.physicianId, physicianId));

    return {
      averageRating: result?.averageRating ? parseFloat(result.averageRating.toString()) : 0,
      totalRatings: result?.totalRatings ? parseInt(result.totalRatings.toString()) : 0,
    };
  }

  async setImageUrlFromFile(path: string, userId: string){
    const [physicianDataRecord] = await db.update(physicianData).set({
      imageUrl: path,
    }).where(eq(physicianData.userId, userId)).returning();

    return physicianDataRecord;

  }
}

