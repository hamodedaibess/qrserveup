import { asSystem, withTenant } from './dal';
import { tenants, staff } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  // 1. إنشاء tenant B + staff (عبر asSystem)
  const tenantBId = await asSystem(async (tx) => {
    let [tb] = await tx.select().from(tenants).where(eq(tenants.slug, 'tenant-b')).limit(1);
    if (!tb) {
      [tb] = await tx.insert(tenants).values({
        slug: 'tenant-b', name: 'Tenant B', email: 'b@example.com',
        countryCode: 'EG', defaultCurrency: 'EGP', defaultTimezone: 'Africa/Cairo', status: 'active',
      }).returning();
    }
    const [bStaff] = await tx.select().from(staff).where(eq(staff.tenantId, tb!.id)).limit(1);
    if (!bStaff) {
      const pinHash = await bcrypt.hash('9999', 10);
      await tx.insert(staff).values({ tenantId: tb!.id, name: 'B Staff', pinHash, mustChangePin: false, isActive: true });
    }
    return tb!.id;
  });
  console.log('Tenant B ID:', tenantBId);

  // 2. الحصول على tenant A
  const tenantAId = await asSystem(async (tx) => {
    const [ta] = await tx.select().from(tenants).where(eq(tenants.slug, 'demo-restaurant')).limit(1);
    return ta!.id;
  });
  console.log('Tenant A ID:', tenantAId);

  // 3. اختبار العزل: withTenant(A) يقرأ كل staff
  console.log('\n=== Test 1: withTenant(A) sees only A staff ===');
  const aStaff = await withTenant(tenantAId, async (tx) => tx.select().from(staff));
  console.log('Count:', aStaff.length, '| Names:', aStaff.map((s: any) => s.name));

  // 4. اختبار العزل: withTenant(B) يقرأ كل staff
  console.log('\n=== Test 2: withTenant(B) sees only B staff ===');
  const bStaff = await withTenant(tenantBId, async (tx) => tx.select().from(staff));
  console.log('Count:', bStaff.length, '| Names:', bStaff.map((s: any) => s.name));

  // 5. محاولة قراءة staff B من سياق A (يجب 0)
  console.log('\n=== Test 3: withTenant(A) tries to read B staff by id ===');
  const bStaffIds = await withTenant(tenantBId, async (tx) => tx.select({ id: staff.id }).from(staff));
  const leaked = await withTenant(tenantAId, async (tx) =>
    tx.select().from(staff).where(eq(staff.id, bStaffIds[0]!.id))
  );
  console.log('Attempted to read B staff by id from A context. Rows leaked:', leaked.length, '(expected 0)');

  // 6. محاولة كتابة staff في سياق A لكن tenant_id = B (يجب أن تفشل)
  console.log('\n=== Test 4: withTenant(A) tries to INSERT staff with tenantId=B ===');
  try {
    await withTenant(tenantAId, async (tx) =>
      tx.insert(staff).values({ tenantId: tenantBId, name: 'Hacker', isActive: true })
    );
    console.log('❌ LEAK: insert succeeded (should have been blocked)');
  } catch (e: any) {
    console.log('✅ BLOCKED by RLS:', e.message.split('\n')[0]);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
