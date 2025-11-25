import { db } from "../../../app/config/db";
import { 
  customerData,
  users,
  type CustomerData,
  type InsertCustomerData,
  type UpdateCustomerData,
  User,
} from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";
import { UserRepository } from "../../user/repository/user.repository";

export class CustomerRepository {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
  }

  async getCustomerDataByUserId(userId: string) {
    const data = await db
      .select({
        birthday: customerData.birthday,
        gender: customerData.gender,
        id: customerData.id,
        diagnosisDate: customerData.diagnosisDate,
        weight: customerData.weight,
        height: customerData.height,
        diabetesType: customerData.diabetesType,
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(customerData)
      .where(eq(customerData.userId, userId))
      .limit(1)
      .leftJoin(users, eq(customerData.userId, users.id));
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

  async updateCustomerData(userId: string, data: UpdateCustomerData) {
    const { firstName, lastName, ...rest } = data;
    const [customerDataRecord] = await db
      .update(customerData)
      .set({
        ...rest,
        updatedAt: new Date(),
      })
      .where(eq(customerData.userId, userId))
      .returning();
    
    if (!customerDataRecord) {
      throw new Error("Customer data not found");
    }
    const object: Partial<User> = {
      updatedAt: new Date(),
    }

    if(firstName) {
      object.firstName = firstName;
    }

    if(lastName) {
      object.lastName = lastName;
    }

    if(object.firstName || object.lastName) 
      await this.userRepository.updateUser(userId, object);

    return {
      ...customerDataRecord,
      firstName: object.firstName,
      lastName: object.lastName,
    };
  }

  async deleteCustomerData(userId: string): Promise<void> {
    await db.delete(customerData).where(eq(customerData.userId, userId));
  }
}

