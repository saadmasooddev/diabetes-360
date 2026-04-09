import { db, dbUtils } from "../../../app/config/db";
import {
	customerData,
	users,
	type CustomerData,
	type InsertCustomerData,
	type UpdateCustomerData,
	type User,
	AdditionalProfileDataValues,
	YES_NO_NOT_SURE_VALUES,
	BLOOD_SUGAR_READING_TYPES_ENUM,
	BloodSugarReadingTypeEnumValues,
} from "../../auth/models/user.schema";
import { eq } from "drizzle-orm";
import { UserRepository } from "../../user/repository/user.repository";
import { Tx } from "../../food/models/food.schema";
import { HealthRepository } from "../../health/repository/health.repository";

type BloodSugarReadingTypeData = {
	userId: string;
	bloodSugarReading: string;
	tx?: Tx;
};

export class CustomerRepository {
	private userRepository: UserRepository;
	private healthRepository: HealthRepository;
	constructor() {
		this.userRepository = new UserRepository();
		this.healthRepository = new HealthRepository();
	}

	async getCustomerDataByUserId(userId: string) {
		const data = await db
			.select({
				birthday: customerData.birthday,
				gender: customerData.gender,
				id: customerData.id,
				weight: customerData.weight,
				height: customerData.height,
				diabetesType: customerData.diabetesType,
				createdAt: customerData.createdAt,
				updatedAt: customerData.updatedAt,
				firstName: users.firstName,
				lastName: users.lastName,
				paymentType: users.paymentType,
				mainGoal: customerData.mainGoal,
				medicationInfo: customerData.medicationInfo,
			})
			.from(customerData)
			.where(eq(customerData.userId, userId))
			.limit(1)
			.leftJoin(users, eq(customerData.userId, users.id));
		return data[0];
	}

	async createCustomerData(
		data: InsertCustomerData & { userId: string },
		tx?: Tx,
	): Promise<CustomerData> {
		const dbConn = tx || db;
		const [customerDataRecord] = await dbConn
			.insert(customerData)
			.values({
				...data,
				userId: data.userId,
			})
			.returning();

		return customerDataRecord;
	}

	async updateUserProfileComplete(
		userId: string,
		profileComplete: boolean,
		tx?: Tx,
	) {
		const dbConn = tx || db;
		await dbConn
			.update(users)
			.set({
				profileComplete,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));
	}

	private readonly bloodSugarReadingTypeMap: Record<
		BloodSugarReadingTypeEnumValues,
		(data: BloodSugarReadingTypeData) => Promise<void>
	> = {
		[BLOOD_SUGAR_READING_TYPES_ENUM.FASTING]: async (data) => {
			await this.healthRepository.createMetricsBatch(
				{
					userId: data.userId,
					bloodSugar: parseFloat(data.bloodSugarReading!),
					recordedAt: new Date().toISOString(),
					bloodSugarReadingType: BLOOD_SUGAR_READING_TYPES_ENUM.FASTING,
				},
				data.tx,
			);
		},
		[BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C]: async (data) => {
			await this.healthRepository.createHba1cMetric(
				{
					userId: data.userId,
					hba1c: data.bloodSugarReading,
					recordedAt: new Date().toISOString(),
				},
				data.tx,
			);
		},
		[BLOOD_SUGAR_READING_TYPES_ENUM.RANDOM]: async (data) => {
			await this.healthRepository.createMetricsBatch(
				{
					userId: data.userId,
					bloodSugar: parseFloat(data.bloodSugarReading!),
					recordedAt: new Date().toISOString(),
					bloodSugarReadingType: BLOOD_SUGAR_READING_TYPES_ENUM.RANDOM,
				},
				data.tx,
			);
		},
		[BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL]: async () => {},
	};

	async createCustomerDataAndUpdateUserProfileCompleteTransaction(
		userId: string,
		data: InsertCustomerData,
		additionalData?: AdditionalProfileDataValues,
	) {
		return await dbUtils.transaction(async (tx) => {
			const customerData = await this.createCustomerData(
				{
					...data,
					userId,
				},
				tx,
			);

			if (
				additionalData &&
				additionalData.bloodSugarType &&
				additionalData.bloodSugarReading &&
				additionalData.knowsBloodSugarValue === YES_NO_NOT_SURE_VALUES.YES
			) {
				const f =
					this.bloodSugarReadingTypeMap[
						additionalData.bloodSugarType as BloodSugarReadingTypeEnumValues
					];
				if (!f) {
					throw new Error("Invalid blood sugar reading type provided");
				}

				await f({
					userId,
					bloodSugarReading: additionalData.bloodSugarReading,
					tx: tx,
				});
			}

			await this.updateUserProfileComplete(userId, true, tx);
			return customerData;
		});
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
		};

		if (firstName) {
			object.firstName = firstName;
		}

		if (lastName) {
			object.lastName = lastName;
		}

		if (object.firstName || object.lastName)
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
