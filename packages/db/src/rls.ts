import { sql } from 'drizzle-orm';
import { db } from './index';

const tenantScopedTables = [
  'subscriptions', 'subscription_history', 'branches', 'roles',
  'role_permissions', 'staff', 'staff_branch_roles', 'staff_sessions',
  'staff_activity_log', 'business_days',
];

async function run() {
  console.log('Applying RLS...');

  for (const t of tenantScopedTables) {
    await db.execute(sql.raw(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`));
    await db.execute(sql.raw(`ALTER TABLE ${t} FORCE ROW LEVEL SECURITY`));
    await db.execute(sql.raw(`DROP POLICY IF EXISTS tenant_isolation ON ${t}`));
    await db.execute(sql.raw(`DROP POLICY IF EXISTS system_bypass ON ${t}`));
    await db.execute(sql.raw(`
      CREATE POLICY tenant_isolation ON ${t}
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
    `));
    await db.execute(sql.raw(`
      CREATE POLICY system_bypass ON ${t}
        USING (current_setting('app.system_mode', true) = 'true')
        WITH CHECK (current_setting('app.system_mode', true) = 'true')
    `));
    console.log(`OK ${t}`);
  }

  // tenants: policy خاصة
  await db.execute(sql.raw(`ALTER TABLE tenants ENABLE ROW LEVEL SECURITY`));
  await db.execute(sql.raw(`ALTER TABLE tenants FORCE ROW LEVEL SECURITY`));
  await db.execute(sql.raw(`DROP POLICY IF EXISTS tenant_self ON tenants`));
  await db.execute(sql.raw(`DROP POLICY IF EXISTS system_bypass ON tenants`));
  await db.execute(sql.raw(`
    CREATE POLICY tenant_self ON tenants
      USING (id = current_setting('app.tenant_id', true)::uuid)
      WITH CHECK (id = current_setting('app.tenant_id', true)::uuid)
  `));
  await db.execute(sql.raw(`
    CREATE POLICY system_bypass ON tenants
      USING (current_setting('app.system_mode', true) = 'true')
      WITH CHECK (current_setting('app.system_mode', true) = 'true')
  `));
  console.log('OK tenants');

  // auth_users: NO RLS في Phase 1 (يحتاج login قبل معرفة tenant) — ADR-010
  console.log('SKIP auth_users (ADR-010)');

  console.log('Done.');
  process.exit(0);
}

run().catch((e) => { console.error('FAILED:', e); process.exit(1); });
