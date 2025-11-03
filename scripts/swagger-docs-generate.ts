import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { swaggerSpec } from '../server/src/config/swagger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = join(__dirname, '..', 'swagger.json');

writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
console.log(`Swagger JSON generated at: ${outputPath}`);