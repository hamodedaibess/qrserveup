import { db, authUsers } from '@qrserveup/db';
import { eq } from 'drizzle-orm';
import { verifyPassword } from './password';
import { createSession } from './session';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(data: unknown, ipAddress: string | null, userAgent: string | null) {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'بيانات غير صالحة' };
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1);

  if (!user || !user.isActive) {
    return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  }

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) {
    return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  }

  await db.update(authUsers).set({ lastLoginAt: new Date() }).where(eq(authUsers.id, user.id));

  const session = await createSession({
    tenantId: user.tenantId,
    authUserId: user.id,
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    sessionId: session.id,
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId }
  };
}
