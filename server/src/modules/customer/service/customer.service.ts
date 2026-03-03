import { CustomerRepository } from "../repository/customer.repository";
import type {
	AdditionalProfileDataValues,
	InsertCustomerData,
	UpdateCustomerData,
} from "../../auth/models/user.schema";
import {
	BadRequestError,
	ConflictError,
	NotFoundError,
} from "../../../shared/errors";
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

	async createCustomerData(
		userId: string, data: InsertCustomerData, 
		additionalData?: AdditionalProfileDataValues
	) {
		const existing =
			await this.customerRepository.getCustomerDataByUserId(userId);
		if (existing) {
			throw new ConflictError("Customer data already exists for this user");
		}

    return await this.customerRepository.createCustomerDataAndUpdateUserProfileCompleteTransaction(userId, data, additionalData)
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
