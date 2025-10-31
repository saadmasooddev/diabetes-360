import { db } from "server/src/app/config/db";
import {  users } from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";

export class UserRepository {
  async getUser(userId: string): Promise<{ id: string, username: string, fullName: string | null, email: string, tier: string | null }> {
    const user = await db.select({ 
      id: users.id, 
      username: users.username, 
      fullName: users.fullName, 
      email: users.email,
      tier: users.tier,
      }).from(users).where(eq(users.id, userId)).limit(1);
    return user[0];
  }
}
