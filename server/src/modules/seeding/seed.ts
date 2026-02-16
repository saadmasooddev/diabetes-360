import { SeedingService } from "./service/seeding.service";

export const seedService = new SeedingService();
seedService
	.seedSettings()
	.catch((error) => console.error(error))
	.then((res) => {
		console.log(res);
		process.exit(0);
	});
