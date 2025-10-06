import { defineConfig } from "drizzle-kit";

// Default local PostgreSQL connection
const defaultConnectionString = 'postgresql://postgres:password@localhost:5432/student_nursing_center';

// Use environment variable or default to local PostgreSQL
const databaseUrl = process.env.DATABASE_URL || defaultConnectionString;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
