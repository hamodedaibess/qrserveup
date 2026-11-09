import { outboxEvents } from './schema';

export type OutboxEventInput = {
  tenantId?: string | null;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  sequenceNo?: number | null;
  branchId?: string | null;
  payload: Record<string, unknown>;
  scheduledAt?: Date;
};

export async function enqueueOutbox(tx: any, e: OutboxEventInput): Promise<string> {
  const [row] = await tx.insert(outboxEvents).values({
    tenantId: e.tenantId ?? null,
    aggregateType: e.aggregateType,
    aggregateId: e.aggregateId,
    eventType: e.eventType,
    sequenceNo: e.sequenceNo ?? null,
    branchId: e.branchId ?? null,
    payload: e.payload,
    scheduledAt: e.scheduledAt ?? new Date(),
  }).returning({ id: outboxEvents.id });
  return row.id;
}
