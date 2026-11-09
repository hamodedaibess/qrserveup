import { pgTable, uuid, varchar, boolean, timestamp, text, smallint, numeric, integer, jsonb, char, pgEnum, date, time, inet, bigint } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

// ==========================================
// ENUMS (من ERD §1.5)
// ==========================================
export const subscriptionStatusEnum = pgEnum('subscription_status', ['TRIAL', 'ACTIVE', 'GRACE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'ARCHIVED']);
export const staffActorEnum = pgEnum('staff_actor', ['USER', 'SYSTEM', 'PLATFORM_OWNER', 'GUEST']);
// (باقي الـ Enums سنضيفها في الدفعة القادمة الخاصة بالطلبات والمدفوعات)

// ==========================================
// BATCH 1: Platform & Tenants
// ==========================================
export const platformUsers = pgTable('platform_users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  totpSecret: varchar('totp_secret', { length: 255 }),
  role: varchar('role', { length: 32 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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

export const planEntitlements = pgTable('plan_entitlements', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  featureKey: varchar('feature_key', { length: 63 }).notNull(),
  featureType: varchar('feature_type', { length: 16 }).notNull(),
  limitValue: integer('limit_value'),
  enabled: boolean('enabled'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

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
  ownerUserId: uuid('owner_user_id'),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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

// ==========================================
// BATCH 2: Subscriptions & Tenant Foundation
// ==========================================
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  planId: uuid('plan_id').notNull().references(() => plans.id),
  status: subscriptionStatusEnum('status').notNull(),
  billingCycle: varchar('billing_cycle', { length: 8 }).notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  graceEndsAt: timestamp('grace_ends_at', { withTimezone: true }),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  externalProvider: varchar('external_provider', { length: 32 }),
  externalSubscriptionId: varchar('external_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionHistory = pgTable('subscription_history', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id),
  eventType: varchar('event_type', { length: 32 }).notNull(),
  fromPlanId: uuid('from_plan_id').references(() => plans.id),
  toPlanId: uuid('to_plan_id').references(() => plans.id),
  amount: numeric('amount', { precision: 18, scale: 4 }),
  currencyCode: char('currency_code', { length: 3 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  slug: varchar('slug', { length: 63 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 32 }),
  timezone: varchar('timezone', { length: 64 }).notNull(),
  currencyCode: char('currency_code', { length: 3 }).notNull(),
  businessDayCutoff: time('business_day_cutoff').notNull().default('04:00'),
  serviceChargePct: numeric('service_charge_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  taxInclusive: boolean('tax_inclusive').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  code: varchar('code', { length: 63 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  code: varchar('code', { length: 63 }).primaryKey(),
  category: varchar('category', { length: 63 }).notNull(),
  description: text('description'),
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionCode: varchar('permission_code', { length: 63 }).notNull().references(() => permissions.code),
});

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  pinHash: varchar('pin_hash', { length: 255 }),
  mustChangePin: boolean('must_change_pin').notNull().default(true),
  employeeCode: varchar('employee_code', { length: 32 }),
  isActive: boolean('is_active').notNull().default(true),
  hiredAt: timestamp('hired_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const staffBranchRoles = pgTable('staff_branch_roles', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
});

export const staffSessions = pgTable('staff_sessions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  staffId: uuid('staff_id').references(() => staff.id),
  authUserId: uuid('auth_user_id').references(() => authUsers.id),
  kind: varchar('kind', { length: 16 }).notNull(),
  deviceFingerprint: varchar('device_fingerprint', { length: 255 }),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const staffActivityLog = pgTable('staff_activity_log', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  staffId: uuid('staff_id').references(() => staff.id),
  branchId: uuid('branch_id').references(() => branches.id),
  action: varchar('action', { length: 63 }).notNull(),
  targetType: varchar('target_type', { length: 63 }),
  targetId: uuid('target_id'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const businessDays = pgTable('business_days', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  businessDate: date('business_date').notNull(),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedByStaffId: uuid('closed_by_staff_id').references(() => staff.id),
  openingFloat: numeric('opening_float', { precision: 18, scale: 4 }),
  closingCount: numeric('closing_count', { precision: 18, scale: 4 }),
  notes: text('notes'),
});

// ==========================================
// BATCH 2 (P1-007): Infrastructure — Audit
// Ref: ERD §9.1 — no FK, append-only
// ==========================================

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id'),
  actorType: staffActorEnum('actor_type').notNull(),
  actorId: uuid('actor_id'),
  entityType: varchar('entity_type', { length: 63 }).notNull(),
  entityId: uuid('entity_id'),
  action: varchar('action', { length: 63 }).notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  reason: text('reason'),
  correlationId: varchar('correlation_id', { length: 64 }),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ==========================================
// BATCH 2 (P1-007): Infrastructure — Outbox
// Ref: ERD §9.2, ADR-005
// ==========================================

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid('tenant_id'),
  aggregateType: varchar('aggregate_type', { length: 63 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  eventType: varchar('event_type', { length: 63 }).notNull(),
  sequenceNo: bigint('sequence_no', { mode: 'number' }),
  branchId: uuid('branch_id'),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  attempts: smallint('attempts').notNull().default(0),
  lastError: text('last_error'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
