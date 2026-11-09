import { sql } from 'drizzle-orm';
import { db } from './index';

export async function withTenant<T>(
  tenantId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.tenant_id = ${tenantId}`);
    return callback(tx);
  });
}

export async function asSystem<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`RESET app.tenant_id`);
    return callback(tx);
  });
}
