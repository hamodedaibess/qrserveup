import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

// تحميل متغيرات البيئة من الجذر
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export * from './schema';
export * from './dal';
