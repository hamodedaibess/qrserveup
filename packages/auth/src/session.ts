import { db, staffSessions } from '@qrserveup/db';

export async function createSession(data: {
  tenantId: string | null;
  authUserId: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8); // 8 ساعات

  const [session] = await db.insert(staffSessions).values({
    tenantId: data.tenantId,
    authUserId: data.authUserId,
    kind: 'email',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    expiresAt,
  }).returning();

  return session;
}

// إضافة: جلسة موظف عبر PIN
export async function createStaffSession(data: {
  tenantId: string;
  staffId: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12); // 12 ساعة للـ ops

  const [session] = await db.insert(staffSessions).values({
    tenantId: data.tenantId,
    staffId: data.staffId,
    kind: 'pin',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    expiresAt,
  }).returning();

  return session;
}
