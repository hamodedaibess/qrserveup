import { db, authUsers } from './index';
import { eq } from 'drizzle-orm';
async function cleanup() {
  await db.delete(authUsers).where(eq(authUsers.email, 'admin@qrserveup.com'));
  console.log('✅ Old user deleted');
  process.exit(0);
}
cleanup().catch((e) => { console.error(e); process.exit(1); });
