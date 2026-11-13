import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (connectionString) {
  try {
    const client = postgres(connectionString, {
      prepare: false, // For serverless compatibility (Supabase / Neon)
      max: 10,
    });
    dbInstance = drizzle(client, { schema });
  } catch (err) {
    console.warn('Failed to initialize Drizzle with DATABASE_URL, using fallback repository:', err);
  }
}

export const drizzleDb = dbInstance;
export { schema };
