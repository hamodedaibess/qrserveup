import { sql } from 'drizzle-orm';
import { db } from './index';

export async function withTenant<T>(
  tenantId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(sql`SELECT set_config('app.system_mode', 'false', true)`);
    return callback(tx);
  });
}

export async function asSystem<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.system_mode', 'true', true)`);
    return callback(tx);
  });
}
