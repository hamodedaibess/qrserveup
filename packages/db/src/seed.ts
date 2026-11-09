import { asSystem } from './dal';
import { plans, permissions, authUsers, tenants, staff } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting seed...');

  await asSystem(async (tx) => {
    await tx.insert(plans).values([
      { code: 'trial', name: 'Free Trial', priceMonthly: '0', priceYearly: '0', currencyCode: 'EGP', trialDays: 14 },
      { code: 'standard', name: 'Standard', priceMonthly: '599', priceYearly: '5990', currencyCode: 'EGP', trialDays: 0 },
    ]).onConflictDoNothing();

    await tx.insert(permissions).values([
      { code: 'orders.view', category: 'orders', description: 'View orders' },
      { code: 'orders.confirm', category: 'orders', description: 'Confirm pending orders' },
      { code: 'finance.view', category: 'finance', description: 'View financial reports' },
    ]).onConflictDoNothing();

    const ownerPw = await bcrypt.hash('password123', 12);
    await tx.insert(authUsers).values({
      email: 'admin@qrserveup.com', passwordHash: ownerPw,
      role: 'platform_owner', tenantId: null, emailVerified: true,
    }).onConflictDoNothing();

    let [tenant] = await tx.select().from(tenants).where(eq(tenants.slug, 'demo-restaurant')).limit(1);
    if (!tenant) {
      [tenant] = await tx.insert(tenants).values({
        slug: 'demo-restaurant', name: 'Demo Restaurant',
        email: 'demo@example.com', countryCode: 'EG',
        defaultCurrency: 'EGP', defaultTimezone: 'Africa/Cairo', status: 'active',
      }).returning();
      console.log('Created tenant');
    } else { console.log('Tenant exists'); }

    let [emp] = await tx.select().from(staff).where(eq(staff.tenantId, tenant!.id)).limit(1);
    if (!emp) {
      const pinHash = await bcrypt.hash('1234', 10);
      [emp] = await tx.insert(staff).values({
        tenantId: tenant!.id, name: 'Demo Waiter',
        pinHash, mustChangePin: false, isActive: true,
      }).returning();
      console.log('Created staff');
    } else { console.log('Staff exists'); }
  });

  console.log('Seed completed!');
  process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
