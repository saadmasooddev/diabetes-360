import { db } from "server/src/app/config/db";
import {  customerData, physicianData, physicianSpecialties, users, type CustomerData, type PhysicianData, User } from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "server/src/shared/errors";

export class UserRepository {
  async getUser(userId: string) {
    
    const user = await db.select({ 
      id: users.id, 
      firstName: users.firstName, 
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      paymentType: users.paymentType,
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

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user
  }
}
