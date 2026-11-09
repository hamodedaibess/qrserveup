import { asSystem, withTenant } from '@qrserveup/db';
import { authUsers, staffSessions } from '@qrserveup/db';
import { eq } from 'drizzle-orm';
import { verifyPassword } from './password';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function login(data: unknown, ipAddress: string | null, userAgent: string | null) {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: 'بيانات غير صالحة' };

  const { email, password } = parsed.data;

  // البحث عبر asSystem (قبل معرفة الـ tenant)
  const user = await asSystem(async (tx) => {
    const [u] = await tx.select().from(authUsers).where(eq(authUsers.email, email)).limit(1);
    return u;
  });

  if (!user || !user.isActive) return { success: false as const, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) return { success: false as const, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };

  // إنشاء الجلسة: platform sessions (tenantId=null) تحتاج asSystem، وإلا withTenant
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8);

  const session = await asSystem(async (tx) => {
    const [s] = await tx.insert(staffSessions).values({
      tenantId: user.tenantId,
      authUserId: user.id,
      kind: 'email',
      ipAddress: ipAddress as any,
      userAgent,
      expiresAt,
    }).returning();
    return s;
  });

  await asSystem(async (tx) => {
    await tx.update(authUsers).set({ lastLoginAt: new Date() }).where(eq(authUsers.id, user.id));
  });

  return {
    success: true as const,
    sessionId: session!.id,
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
  };
}
