import { NotFoundError } from "server/src/shared/errors";
import { UserRepository } from "../repository/user.repository";
import { ROLE_PERMISSIONS } from "server/src/shared/constants/roles";
import { UserRole } from "../../auth/models/user.schema";
import { TwoFactorService } from "../../twoFactor/service/twoFactor.service";

export class UserService {
	private readonly userRepository: UserRepository;
	private readonly twoFactorService: TwoFactorService;
	constructor() {
		this.userRepository = new UserRepository();
		this.twoFactorService = new TwoFactorService();
	}
	async getProfile(userId: string) {
		const user = await this.userRepository.getUser(userId);
		if (!user) {
			throw new NotFoundError("User not found");
		}
		const twoFactorStatus = await this.twoFactorService.get2FAStatus(user.id);

		return {
			user: user,
			permissions: [...ROLE_PERMISSIONS[user.role as UserRole]],
			requiresTwoFactor: twoFactorStatus.enabled && twoFactorStatus.verified,
		};
	}
}
