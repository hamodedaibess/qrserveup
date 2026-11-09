import { withTenant, asSystem } from './dal';
import { recordAudit } from './audit';
import { enqueueOutbox } from './outbox';
import { tenants, auditLog, outboxEvents } from './schema';
import { sql, eq, and } from 'drizzle-orm';

const TAG = 'TEST-P1-007-' + Date.now();
const log = (ok: boolean, m: string) => console.log((ok ? 'PASS' : 'FAIL') + ' | ' + m);

async function main() {
  console.log('=== P1-007 Integration Test ===');
  console.log('Tag:', TAG);

  // Lookup tenant ids
  const [A] = await asSystem(async (tx) => tx.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, 'demo-restaurant')));
  const [B] = await asSystem(async (tx) => tx.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, 'tenant-b')));
  if (!A || !B) { console.error('FAIL: tenants not found'); process.exit(1); }
  console.log('Tenant A:', A.id, '| Tenant B:', B.id);

  // TEST 1: write audit as A, verify visible in same tx
  await withTenant(A.id, async (tx) => {
    await recordAudit(tx, { tenantId: A.id, actorType: 'USER', entityType: 'test', action: 'p1-007.write', correlationId: TAG });
    const rows = await tx.select({ id: auditLog.id }).from(auditLog).where(eq(auditLog.correlationId, TAG));
    log(rows.length === 1, 'TEST 1: tenant A sees own audit row (' + rows.length + ')');
  });

  // TEST 2: tenant B cannot see A's row
  await withTenant(B.id, async (tx) => {
    const rows = await tx.select({ id: auditLog.id }).from(auditLog).where(eq(auditLog.correlationId, TAG));
    log(rows.length === 0, 'TEST 2: tenant B cannot see tenant A audit row (' + rows.length + ')');
  });

  // TEST 3: asSystem sees all + can write platform-level (tenantId=null)
  await asSystem(async (tx) => {
    await recordAudit(tx, { tenantId: null, actorType: 'PLATFORM_OWNER', entityType: 'test', action: 'p1-007.platform', correlationId: TAG });
    const rows = await tx.select({ id: auditLog.id }).from(auditLog).where(eq(auditLog.correlationId, TAG));
    log(rows.length === 2, 'TEST 3: system sees all audit rows (' + rows.length + ')');
  });

  // TEST 4: tenant A cannot see platform-level (null tenant) row
  await withTenant(A.id, async (tx) => {
    const rows = await tx.select({ id: auditLog.id, tenantId: auditLog.tenantId }).from(auditLog).where(eq(auditLog.correlationId, TAG));
    log(rows.length === 1 && rows[0].tenantId === A.id, 'TEST 4: tenant A cannot see null-tenant row (' + rows.length + ')');
  });

  // TEST 5: outbox isolation
  await withTenant(A.id, async (tx) => {
    await enqueueOutbox(tx, { tenantId: A.id, aggregateType: 'test', aggregateId: A.id, eventType: 'p1-007.test', payload: { tag: TAG } });
    const rows = await tx.select({ id: outboxEvents.id }).from(outboxEvents).where(sql`payload->>'tag' = ${TAG}`);
    log(rows.length === 1, 'TEST 5: outbox write + read as A (' + rows.length + ')');
  });

  // TEST 6: append-only enforced (REVOKE UPDATE,DELETE from owner)
  await asSystem(async (tx) => {
    let blocked = false;
    try { await tx.delete(auditLog).where(eq(auditLog.correlationId, TAG)); }
    catch (e: any) { if (e.cause?.code === '42501') blocked = true; else throw e; }
    log(blocked, 'TEST 6: append-only enforced (DELETE blocked by REVOKE)');
  });

  // Cleanup: skip (append-only). Manual cleanup via Neon SQL Editor with neondb_owner.
  console.log('=== DONE ===');
  process.exit(0);
}

main().catch((e) => { console.error('FAIL (exception):', e.message); console.error('cause.code:', e.cause?.code); console.error('cause.message:', e.cause?.message); console.error('cause.detail:', e.cause?.detail); console.error('cause.constraint:', e.cause?.constraint); process.exit(1); });
