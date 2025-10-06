// Local PostgreSQL database configuration
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Default local PostgreSQL connection
const defaultConnectionString = 'postgresql://postgres:password@localhost:5432/student_nursing_center';

// Use environment variable or default to local PostgreSQL
const connectionString = process.env.DATABASE_URL || defaultConnectionString;

console.log('🐘 Connecting to PostgreSQL database...');

export const pool = new Pool({ 
  connectionString,
  // Additional local configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});
