import { db } from './index';
import { plans, permissions, authUsers } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting seed...');

  const plansData = [
    { code: 'trial', name: 'Free Trial', priceMonthly: '0', priceYearly: '0', currencyCode: 'EGP', trialDays: 14 },
    { code: 'standard', name: 'Standard', priceMonthly: '599', priceYearly: '5990', currencyCode: 'EGP', trialDays: 0 },
  ];

  for (const plan of plansData) {
    await db.insert(plans).values(plan).onConflictDoNothing();
  }

  const permissionsData = [
    { code: 'orders.view', category: 'orders', description: 'View orders' },
    { code: 'orders.confirm', category: 'orders', description: 'Confirm pending orders' },
    { code: 'finance.view', category: 'finance', description: 'View financial reports' },
  ];

  for (const perm of permissionsData) {
    await db.insert(permissions).values(perm).onConflictDoNothing();
  }

  const passwordHash = await bcrypt.hash('password123', 12);
  
  await db.insert(authUsers).values({
    email: 'admin@qrserveup.com',
    passwordHash,
    role: 'platform_owner',
    tenantId: null,
    emailVerified: true,
  }).onConflictDoNothing();

  console.log('✅ Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
