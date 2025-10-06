// Local PostgreSQL database configuration
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create PostgreSQL connection with explicit non-WebSocket configuration
const sql = postgres(process.env.DATABASE_URL, { 
  ssl: false,
  max: 10,
  transform: postgres.camel,
  connection: {
    application_name: 'smartgarden_app'
  },
  // Ensure no WebSocket/TLS conflicts
  prepare: false,
  types: {},
  debug: false
});

export const db = drizzle({ client: sql, schema });
