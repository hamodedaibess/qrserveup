# QRServeUp — Master Checklist

## Phase 1 — Foundation  [~] IN_PROGRESS

- [x] P1-001 Monorepo + pnpm + Turborepo + TS Strict (2026-11-09)
- [x] P1-002 Neon + Drizzle + 16 tables + Seed (2026-11-09)
- [x] P1-003 Auth (email+password) + sessions (2026-11-09)
- [x] P1-004 Auth (PIN) + lockout (2026-11-09)
  - [x] PIN hash bcrypt cost=10
  - [x] 5 failed → 15 min lockout (in-memory, ADR-009)
  - [x] POST /api/auth/pin → 200 OK / 401 / 429
- [x] P1-005 RBAC + permissions package (2026-11-09)
- [x] P1-006 Multi-tenant context + RLS + DAL (2026-11-09)
- [x] P1-007 Audit Log + Outbox skeleton (2026-11-09)
  - [x] staff_actor enum + audit_log (14 cols) + outbox_events (14 cols)
  - [x] Migration 0002 (applied manually — see HANDOFF)
  - [x] RLS + system_bypass with NULLIF fix (ADR-010)
  - [x] REVOKE UPDATE/DELETE on audit_log (ADR-011)
  - [x] 4 indexes (audit×2, outbox×2)
  - [x] Helpers: recordAudit() + enqueueOutbox()
  - [x] Integration tests 6/6 PASS
- [~] P1-008 CI + Sentry + OTel ← CURRENT
- [ ] P1-009 Testing infra (Vitest + Playwright)
- [ ] P1-010 Vertical slice: login → dashboard + E2E
