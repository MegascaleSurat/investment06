import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import * as relations from './relations/index.js';

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables');
}

const client = postgres(connectionString);
export const db = drizzle(client, { 
  schema: { ...schema, ...relations },
  logger: process.env.NODE_ENV === 'development',
});
