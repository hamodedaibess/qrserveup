import { db } from './index';
import { plans, permissions, authUsers, tenants, staff } from './schema';
import { hashPassword, hashPin } from '@qrserveup/auth';

async function seed() {
  console.log('🌱 Starting seed...');

  // Plans
  await db.insert(plans).values([
    { code: 'trial', name: 'Free Trial', priceMonthly: '0', priceYearly: '0', currencyCode: 'EGP', trialDays: 14 },
    { code: 'standard', name: 'Standard', priceMonthly: '599', priceYearly: '5990', currencyCode: 'EGP', trialDays: 0 },
  ]).onConflictDoNothing();

  // Permissions
  await db.insert(permissions).values([
    { code: 'orders.view', category: 'orders', description: 'View orders' },
    { code: 'orders.confirm', category: 'orders', description: 'Confirm pending orders' },
    { code: 'finance.view', category: 'finance', description: 'View financial reports' },
  ]).onConflictDoNothing();

  // Platform Owner (email/password)
  const ownerPw = await hashPassword('password123');
  await db.insert(authUsers).values({
    email: 'admin@qrserveup.com',
    passwordHash: ownerPw,
    role: 'platform_owner',
    tenantId: null,
    emailVerified: true,
  }).onConflictDoNothing();

  // Demo Tenant
  const [tenant] = await db.insert(tenants).values({
    slug: 'demo-restaurant',
    name: 'Demo Restaurant',
    email: 'demo@example.com',
    countryCode: 'EG',
    defaultCurrency: 'EGP',
    defaultTimezone: 'Africa/Cairo',
    status: 'active',
  }).onConflictDoNothing().returning();

  if (tenant) {
    // Demo Staff with PIN 1234
    const pinHash = await hashPin('1234');
    await db.insert(staff).values({
      tenantId: tenant.id,
      name: 'Demo Waiter',
      pinHash,
      mustChangePin: false,
      isActive: true,
    }).onConflictDoNothing();
    console.log('✅ Demo tenant + staff created');
  }

  console.log('✅ Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
