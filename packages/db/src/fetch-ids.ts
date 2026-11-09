import { db, tenants, staff } from './index';

async function run() {
  const t = await db.select().from(tenants).limit(1);
  const s = await db.select().from(staff).limit(1);
  if (!t[0] || !s[0]) {
    console.log('❌ No tenant or staff found. Run seed first.');
    process.exit(1);
  }
  console.log('TENANT_ID=' + t[0].id);
  console.log('STAFF_ID=' + s[0].id);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
