import { auditLog } from './schema';

export type AuditEntry = {
  tenantId?: string | null;
  actorType: 'USER' | 'SYSTEM' | 'PLATFORM_OWNER' | 'GUEST';
  actorId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAudit(tx: any, e: AuditEntry): Promise<string> {
  const [row] = await tx.insert(auditLog).values({
    tenantId: e.tenantId ?? null,
    actorType: e.actorType,
    actorId: e.actorId ?? null,
    entityType: e.entityType,
    entityId: e.entityId ?? null,
    action: e.action,
    before: e.before as any,
    after: e.after as any,
    reason: e.reason ?? null,
    correlationId: e.correlationId ?? null,
    ipAddress: e.ipAddress ?? null,
    userAgent: e.userAgent ?? null,
  }).returning({ id: auditLog.id });
  return row.id;
}
