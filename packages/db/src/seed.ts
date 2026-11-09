import { db } from './index';
import { plans, permissions } from './schema';

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. إدخال الباقات (Plans)
  const plansData = [
    { code: 'trial', name: 'Free Trial', priceMonthly: '0', priceYearly: '0', currencyCode: 'EGP', trialDays: 14 },
    { code: 'small', name: 'Small Business', priceMonthly: '299', priceYearly: '2990', currencyCode: 'EGP', trialDays: 0 },
    { code: 'standard', name: 'Standard', priceMonthly: '599', priceYearly: '5990', currencyCode: 'EGP', trialDays: 0 },
    { code: 'pro', name: 'Professional', priceMonthly: '1199', priceYearly: '11990', currencyCode: 'EGP', trialDays: 0 },
    { code: 'enterprise', name: 'Enterprise', priceMonthly: '0', priceYearly: '0', currencyCode: 'EGP', trialDays: 0 },
  ];

  for (const plan of plansData) {
    await db.insert(plans).values(plan).onConflictDoNothing();
  }
  console.log('✅ Plans seeded');

  // 2. إدخال الصلاحيات الأساسية (Permissions)
  const permissionsData = [
    { code: 'orders.view', category: 'orders', description: 'View orders' },
    { code: 'orders.confirm', category: 'orders', description: 'Confirm pending orders' },
    { code: 'orders.cancel', category: 'orders', description: 'Cancel orders' },
    { code: 'orders.edit', category: 'orders', description: 'Edit order items' },
    { code: 'finance.view', category: 'finance', description: 'View financial reports' },
    { code: 'finance.refund', category: 'finance', description: 'Process refunds' },
    { code: 'staff.manage', category: 'staff', description: 'Manage staff and roles' },
    { code: 'settings.manage', category: 'settings', description: 'Manage branch settings' },
    { code: 'discounts.apply', category: 'discounts', description: 'Apply discounts' },
    { code: 'discounts.approve', category: 'discounts', description: 'Approve large discounts' },
  ];

  for (const perm of permissionsData) {
    await db.insert(permissions).values(perm).onConflictDoNothing();
  }
  console.log('✅ Permissions seeded');

  console.log('🎉 Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
