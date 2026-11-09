import { withTenant, asSystem, staffSessions } from '@qrserveup/db';

export async function createStaffSession(data: {
  tenantId: string; staffId: string;
  ipAddress: string | null; userAgent: string | null;
}) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12);

  const session = await withTenant(data.tenantId, async (tx) => {
    const [s] = await tx.insert(staffSessions).values({
      tenantId: data.tenantId,
      staffId: data.staffId,
      kind: 'pin',
      ipAddress: data.ipAddress as any,
      userAgent: data.userAgent,
      expiresAt,
    }).returning();
    return s;
  });

  return session;
}

export async function createEmailSession(data: {
  tenantId: string | null; authUserId: string;
  ipAddress: string | null; userAgent: string | null;
}) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8);

  const session = await asSystem(async (tx) => {
    const [s] = await tx.insert(staffSessions).values({
      tenantId: data.tenantId,
      authUserId: data.authUserId,
      kind: 'email',
      ipAddress: data.ipAddress as any,
      userAgent: data.userAgent,
      expiresAt,
    }).returning();
    return s;
  });

  return session;
}
