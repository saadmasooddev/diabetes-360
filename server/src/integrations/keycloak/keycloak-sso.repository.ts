import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../app/config/db";
import {
	customerData,
	physicianData,
	physicianSpecialties,
	PROVIDERS,
	USER_ROLES,
	users,
	userKeycloakIds,
} from "@shared/schema";



export class KeycloakSsoRepository {
  selectUserWithProfile() {
		return db
			.select({
				...getTableColumns(users),
				profileData: {
					...customerData,
					...physicianData,
					specialty: physicianSpecialties.name,
				},
			})
			.from(users)
			.leftJoin(customerData, eq(users.id, customerData.userId))
			.leftJoin(physicianData, eq(users.id, physicianData.userId))
			.leftJoin(
				physicianSpecialties,
				eq(physicianData.specialtyId, physicianSpecialties.id),
			);
  }

	async getUserWithProfileByKeycloakSub(keycloakSub: string) {
		const rows = await this.selectUserWithProfile()
			.innerJoin(userKeycloakIds, eq(users.id, userKeycloakIds.userId))
			.where(eq(userKeycloakIds.keycloakSub, keycloakSub))
			.limit(1);
		return rows[0];
	}

	async linkKeycloakSubject(userId: string, keycloakSub: string): Promise<void> {
		await db
			.insert(userKeycloakIds)
			.values({ userId, keycloakSub })
			.onConflictDoNothing({
				target: [userKeycloakIds.userId, userKeycloakIds.keycloakSub],
			});
	}

	async createKeycloakProvisionedUser(params: {
		firstName: string;
		lastName: string;
		email: string;
		keycloakSub: string;
	}): Promise<string> {
		const result = await db.transaction(async (tx) => {
			const [created] = await tx
				.insert(users)
				.values({
					firstName: params.firstName,
					lastName: params.lastName,
					email: params.email,
					password: null,
					provider: PROVIDERS.KEYCLOAK,
					emailVerified: true,
					role: USER_ROLES.CUSTOMER,
				})
				.returning({ id: users.id });
			if (!created) {
				throw new Error("Failed to create SSO user");
			}
			await tx.insert(userKeycloakIds).values({
				userId: created.id,
				keycloakSub: params.keycloakSub,
			});
			return created.id;
		});
		return result;
	}
}
