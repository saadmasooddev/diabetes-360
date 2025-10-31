import { NotFoundError } from "server/src/shared/errors";
import { UserRepository } from "../repository/user.repository";

export class UserService {
  private userRepository: UserRepository;
  constructor(){
    this.userRepository = new UserRepository();
  }
  async getProfile(userId: string): Promise<{ id: string, username: string, fullName: string | null, email: string, tier: string | null }> {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
}
