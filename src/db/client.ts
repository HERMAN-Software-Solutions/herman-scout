import { neon } from '@neondatabase/serverless';
import { env } from '../config/env';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Export the SQL query function
export const sql = neon(env.DATABASE_URL);// Neon DB connection (Phase 1)
export {};
