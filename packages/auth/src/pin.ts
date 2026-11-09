import bcrypt from 'bcryptjs';
import { withTenant, staff } from '@qrserveup/db';
import { eq, and } from 'drizzle-orm';

const PIN_BCRYPT_COST = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_BCRYPT_COST);
}

export async function verifyPin(hash: string, pin: string): Promise<boolean> {
  try { return await bcrypt.compare(pin, hash); } catch { return false; }
}

interface Attempt { attempts: number; lockedUntil: number | null; }
const lockoutMap = new Map<string, Attempt>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function lockKey(tenantId: string, staffId: string) { return `${tenantId}:${staffId}`; }

export function checkLockout(tenantId: string, staffId: string) {
  const entry = lockoutMap.get(lockKey(tenantId, staffId));
  if (!entry || !entry.lockedUntil) return { locked: false, remainingMs: 0 };
  const remainingMs = entry.lockedUntil - Date.now();
  if (remainingMs <= 0) { lockoutMap.delete(lockKey(tenantId, staffId)); return { locked: false, remainingMs: 0 }; }
  return { locked: true, remainingMs };
}

export function recordFailure(tenantId: string, staffId: string) {
  const key = lockKey(tenantId, staffId);
  const entry = lockoutMap.get(key) ?? { attempts: 0, lockedUntil: null };
  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCKOUT_MS;
  lockoutMap.set(key, entry);
  return { locked: entry.lockedUntil !== null };
}

export function resetAttempts(tenantId: string, staffId: string) { lockoutMap.delete(lockKey(tenantId, staffId)); }

export async function loginWithPin(data: {
  tenantId: string; staffId: string; pin: string;
  ipAddress: string | null; userAgent: string | null;
}) {
  const { tenantId, staffId, pin } = data;

  const lock = checkLockout(tenantId, staffId);
  if (lock.locked) return { success: false as const, error: `الحساب مقفل مؤقتًا. حاول بعد ${Math.ceil(lock.remainingMs / 60000)} دقيقة.`, code: 'LOCKED' };

  const emp = await withTenant(tenantId, async (tx) => {
    const [e] = await tx.select().from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.isActive, true)))
      .limit(1);
    return e;
  });

  if (!emp || !emp.pinHash) {
    recordFailure(tenantId, staffId);
    return { success: false as const, error: 'بيانات غير صحيحة', code: 'INVALID' };
  }

  const valid = await verifyPin(emp.pinHash, pin);
  if (!valid) {
    const { locked } = recordFailure(tenantId, staffId);
    return { success: false as const, error: locked ? 'تم قفل الحساب بعد 5 محاولات فاشلة. حاول بعد 15 دقيقة.' : 'PIN غير صحيح', code: locked ? 'LOCKED_NOW' : 'INVALID' };
  }

  resetAttempts(tenantId, staffId);
  return { success: true as const, staff: emp };
}

export function _resetAllLockouts() { lockoutMap.clear(); }
