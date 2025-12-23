import { CustomerRepository } from "../repository/customer.repository";
import type { InsertCustomerData, UpdateCustomerData } from "../../auth/models/user.schema";
import { BadRequestError, ConflictError, NotFoundError } from "../../../shared/errors";
import { db } from "../../../app/config/db";
import { users } from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";

export class CustomerService {
  private customerRepository: CustomerRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async getCustomerDataByUserId(userId: string) {
    const data = await this.customerRepository.getCustomerDataByUserId(userId);
    if (!data) {
      throw new NotFoundError("Customer data not found");
    }
    return data;
  }

  async createCustomerData(userId: string, data: InsertCustomerData) {
    const existing = await this.customerRepository.getCustomerDataByUserId(userId);
    if (existing) {
      throw new ConflictError("Customer data already exists for this user");
    }

    const customerData = await this.customerRepository.createCustomerData({
      ...data,
      userId,
    });

    await db
      .update(users)
      .set({ 
        profileComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return customerData;
  }

  async updateCustomerData(userId: string, data: UpdateCustomerData) {
    return await this.customerRepository.updateCustomerData(userId, data);
  }

  async deleteCustomerData(userId: string) {
    await this.customerRepository.deleteCustomerData(userId);
    
    // Mark user profile as incomplete when data is deleted
    await db
      .update(users)
      .set({ 
        profileComplete: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

