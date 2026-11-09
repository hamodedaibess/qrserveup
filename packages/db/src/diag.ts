import { sql } from 'drizzle-orm';
import { db } from './index';

async function main() {
  // 1. هل الدور الحالي BYPASSRLS؟
  const role: any = await db.execute(sql`SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`);
  console.log('=== Role info ===');
  console.log(role.rows[0]);

  // 2. هل RLS مُفعّل على staff؟
  const rls: any = await db.execute(sql`SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'staff'`);
  console.log('\n=== RLS on staff ===');
  console.log(rls.rows[0]);

  // 3. ما هي السياسات الموجودة؟
  const pol: any = await db.execute(sql`SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'staff'::regclass`);
  console.log('\n=== Policies on staff ===');
  console.log(pol.rows);

  // 4. اختبار SET LOCAL داخل transaction
  console.log('\n=== SET LOCAL test ===');
  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111'`));
    const check: any = await tx.execute(sql`SELECT current_setting('app.tenant_id', true) as tid`);
    console.log('After SET, tenant_id =', check.rows[0].tid);
  });

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
