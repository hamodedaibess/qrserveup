import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';

// تحميل ملف .env.local من الجذر الرئيسي للمشروع
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
