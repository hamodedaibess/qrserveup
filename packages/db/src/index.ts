import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const candidates = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(__dirname, '../../../.env.local'),
  resolve(__dirname, '../../../../.env.local'),
];
for (const p of candidates) {
  if (existsSync(p)) { dotenv.config({ path: p }); break; }
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
export const appDb = db;

export * from './schema';
export * from './dal';
