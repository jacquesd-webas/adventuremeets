import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

/**
 * Loads .env and .env.<NODE_ENV> files (if present) into process.env.
 * Base .env is loaded first; environment-specific overrides afterwards.
 */
export function loadEnv() {
  const cwd = process.cwd();
  const baseEnvPath = path.join(cwd, '.env');
  console.log({baseEnvPath})
  if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const envSpecificPath = path.join(cwd, `.env.${nodeEnv}`);
  if (fs.existsSync(envSpecificPath)) {
    dotenv.config({ path: envSpecificPath, override: true });
  }
}
