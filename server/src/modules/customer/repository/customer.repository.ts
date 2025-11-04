import { db } from "../../../app/config/db";
import { 
  customerData,
  type CustomerData,
  type InsertCustomerData,
  type UpdateCustomerData,
} from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";

export class CustomerRepository {
  async getCustomerDataByUserId(userId: string): Promise<CustomerData | undefined> {
    const data = await db
      .select()
      .from(customerData)
      .where(eq(customerData.userId, userId))
      .limit(1);
    return data[0];
  }

  async createCustomerData(data: InsertCustomerData & { userId: string }): Promise<CustomerData> {
    const [customerDataRecord] = await db
      .insert(customerData)
      .values({
        ...data,
        userId: data.userId,
      })
      .returning();
    
    return customerDataRecord;
  }

  async updateCustomerData(userId: string, data: UpdateCustomerData): Promise<CustomerData> {
    const [customerDataRecord] = await db
      .update(customerData)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerData.userId, userId))
      .returning();
    
    if (!customerDataRecord) {
      throw new Error("Customer data not found");
    }
    
    return customerDataRecord;
  }

  async deleteCustomerData(userId: string): Promise<void> {
    await db.delete(customerData).where(eq(customerData.userId, userId));
  }
}

