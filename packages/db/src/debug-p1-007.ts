import { asSystem } from './dal';
import { recordAudit } from './audit';

async function main() {
  console.log('=== Drizzle ORM via recordAudit (asSystem, tenantId=null) ===');
  await asSystem(async (tx) => {
    try {
      const id = await recordAudit(tx, {
        tenantId: null,
        actorType: 'PLATFORM_OWNER',
        entityType: 'test',
        action: 'debug-orm',
        correlationId: 'DEBUG-ORM-1',
      });
      console.log('OK recordAudit id:', id);
    } catch (e: any) {
      console.error('--- FAILED ---');
      console.error('message:', e.message);
      console.error('cause.code:', e.cause?.code);
      console.error('cause.message:', e.cause?.message);
      console.error('cause.detail:', e.cause?.detail);
      console.error('cause.hint:', e.cause?.hint);
      console.error('cause.constraint:', e.cause?.constraint);
      console.error('cause.table:', e.cause?.table);
      console.error('cause.column:', e.cause?.column);
    }
  }).then(() => process.exit(0)).catch(e => { console.error('Outer:', e.message); process.exit(1); });
}
main();
