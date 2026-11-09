import bcrypt from 'bcryptjs';
import { db, staff } from '@qrserveup/db';
import { eq, and } from 'drizzle-orm';

// bcryptjs cost=10 أسرع، يكفي لـ PIN قصير
const PIN_BCRYPT_COST = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_BCRYPT_COST);
}

export async function verifyPin(hash: string, pin: string): Promise<boolean> {
  try {
    return await bcrypt.compare(pin, hash);
  } catch {
    return false;
  }
}

// in-memory lockout (سنرحّله لـ Redis في Phase 2)
interface Attempt { attempts: number; lockedUntil: number | null; }
const lockoutMap = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 دقيقة

function lockKey(tenantId: string, staffId: string) {
  return `${tenantId}:${staffId}`;
}

export function checkLockout(tenantId: string, staffId: string): { locked: boolean; remainingMs: number } {
  const entry = lockoutMap.get(lockKey(tenantId, staffId));
  if (!entry || !entry.lockedUntil) return { locked: false, remainingMs: 0 };
  const remainingMs = entry.lockedUntil - Date.now();
  if (remainingMs <= 0) {
    lockoutMap.delete(lockKey(tenantId, staffId));
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs };
}

export function recordFailure(tenantId: string, staffId: string): { locked: boolean } {
  const key = lockKey(tenantId, staffId);
  const entry = lockoutMap.get(key) ?? { attempts: 0, lockedUntil: null };
  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  lockoutMap.set(key, entry);
  return { locked: entry.lockedUntil !== null };
}

export function resetAttempts(tenantId: string, staffId: string): void {
  lockoutMap.delete(lockKey(tenantId, staffId));
}

export async function loginWithPin(data: {
  tenantId: string;
  staffId: string;
  pin: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const { tenantId, staffId, pin } = data;

  // 1. تحقق من القفل
  const lock = checkLockout(tenantId, staffId);
  if (lock.locked) {
    return {
      success: false as const,
      error: `الحساب مقفل مؤقتًا. حاول بعد ${Math.ceil(lock.remainingMs / 60000)} دقيقة.`,
      code: 'LOCKED',
    };
  }

  // 2. جلب الموظف
  const [emp] = await db.select().from(staff)
    .where(and(eq(staff.tenantId, tenantId), eq(staff.id, staffId), eq(staff.isActive, true)))
    .limit(1);

  if (!emp || !emp.pinHash) {
    recordFailure(tenantId, staffId);
    return { success: false as const, error: 'بيانات غير صحيحة', code: 'INVALID' };
  }

  // 3. تحقق من PIN
  const valid = await verifyPin(emp.pinHash, pin);
  if (!valid) {
    const { locked } = recordFailure(tenantId, staffId);
    return {
      success: false as const,
      error: locked ? 'تم قفل الحساب بعد 5 محاولات فاشلة. حاول بعد 15 دقيقة.' : 'PIN غير صحيح',
      code: locked ? 'LOCKED_NOW' : 'INVALID',
    };
  }

  // 4. نجاح → إعادة تعيين المحاولات
  resetAttempts(tenantId, staffId);

  return { success: true as const, staff: emp };
}

// اختبار: إعادة تعيين (للاستخدام في الاختبارات فقط)
export function _resetAllLockouts() {
  lockoutMap.clear();
}
