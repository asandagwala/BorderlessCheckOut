import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/database/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/borderless_checkout',
  },
  verbose: true,
  strict: true,
});
