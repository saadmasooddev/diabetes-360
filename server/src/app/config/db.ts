import * as schema from "@shared/schema";
import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { config } from ".";

const db: NodePgDatabase<typeof schema> = drizzle(config.databaseUrl, {
	schema,
	logger: true,
});

export { db };
