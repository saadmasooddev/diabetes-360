import { db } from "server/src/app/config/db";
import {  customerData, physicianData, physicianSpecialties, users, type CustomerData, type PhysicianData } from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";

export class UserRepository {
  async getUser(userId: string) {
    
    const user = await db.select({ 
      id: users.id, 
      firstName: users.firstName, 
      lastName: users.lastName,
      email: users.email,
      tier: users.tier,
      role: users.role,
      profileComplete: users.profileComplete,
      profileData: {
        ...customerData,
        ...physicianData,
        specialty: physicianSpecialties.name,
      },
    }).from(users).where(eq(users.id, userId)).limit(1)
      .leftJoin(customerData, eq(users.id, customerData.userId))
      .leftJoin(physicianData, eq(users.id, physicianData.userId))
      .leftJoin(physicianSpecialties, eq(physicianData.specialtyId, physicianSpecialties.id))
    return user[0];
  }
}
