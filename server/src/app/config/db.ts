import * as schema from "@shared/schema";
import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { config } from ".";

const db: NodePgDatabase<typeof schema> = drizzle(config.databaseUrl, {
	schema,
});

class DbUtils {
	async transaction<T>(fn: (tx: schema.Tx) => Promise<T>) {
		return await db.transaction(async (tx) => {
			return fn(tx);
		});
	}
}
export const dbUtils = new DbUtils();

export { db };
