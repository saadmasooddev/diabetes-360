import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '.';


const db = drizzle(config.databaseUrl, { schema });

export { db };
