import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Neon Postgres connection string"),
  BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string(),
  
  // Water Tank Settings
  MAX_PER_SCAN: z.coerce.number().default(100),
  DAILY_BATCH: z.coerce.number().default(20),
  BUFFER_THRESHOLD: z.coerce.number().default(20),
  MIN_SCORE: z.coerce.number().default(60),
  SEND_DAYS: z.string().default('1,3,5').transform(val => val.split(',').map(Number)),
});

// This will throw an error and stop the app if any .env variable is missing
export const env = envSchema.parse(process.env);