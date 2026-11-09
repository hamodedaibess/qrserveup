import { pgTable, uuid, varchar, boolean, timestamp, text, smallint, numeric, integer, jsonb, char } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

// 1. platform_users
export const platformUsers = pgTable('platform_users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  totpSecret: varchar('totp_secret', { length: 255 }),
  role: varchar('role', { length: 32 }).notNull(), // OWNER | SUPPORT | FINANCE | DEV
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2. plans
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  code: varchar('code', { length: 63 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  priceMonthly: numeric('price_monthly', { precision: 18, scale: 4 }).notNull(),
  priceYearly: numeric('price_yearly', { precision: 18, scale: 4 }).notNull(),
  currencyCode: char('currency_code', { length: 3 }).notNull(),
  trialDays: smallint('trial_days').notNull().default(14),
  graceDays: smallint('grace_days').notNull().default(7),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: smallint('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 3. plan_entitlements
export const planEntitlements = pgTable('plan_entitlements', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  featureKey: varchar('feature_key', { length: 63 }).notNull(),
  featureType: varchar('feature_type', { length: 16 }).notNull(), // 'limit' | 'boolean'
  limitValue: integer('limit_value'),
  enabled: boolean('enabled'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 4. tenants
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  slug: varchar('slug', { length: 63 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  legalName: varchar('legal_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  countryCode: char('country_code', { length: 2 }).notNull(),
  defaultLocale: varchar('default_locale', { length: 8 }).notNull().default('ar'),
  defaultCurrency: char('default_currency', { length: 3 }).notNull(),
  defaultTimezone: varchar('default_timezone', { length: 64 }).notNull(),
  logoStorageKey: varchar('logo_storage_key', { length: 255 }),
  status: varchar('status', { length: 16 }).notNull().default('onboarding'),
  ownerUserId: uuid('owner_user_id'), // FK أضيفت لاحقاً لتفادي circular dependency
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5. auth_users
export const authUsers = pgTable('auth_users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  totpSecret: varchar('totp_secret', { length: 255 }),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  role: varchar('role', { length: 32 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
