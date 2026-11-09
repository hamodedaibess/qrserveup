# QRServeUp — CHANGELOG

## [Unreleased] — Phase 1 Foundation

### Added
- **P1-001:** Monorepo (pnpm + Turborepo + TS Strict).
- **P1-002:** Neon + Drizzle ORM. 16 tables + Seed.
- **P1-003:** Auth email/password (bcryptjs, ADR-008) + sessions.
- **P1-004:** PIN auth for staff. In-memory lockout: 5 fails → 15 min (ADR-009).
- **P1-005:** RBAC package. `can()` / `canAny()` / `canAll()` / `canInBranch()` / `computeStaffContext()`.
- **P1-006:** RLS on 11 tenant tables + tenants (via `src/rls.ts`). DAL `withTenant()` / `asSystem()`. Cross-tenant isolation verified.
- **P1-007:** Audit Log + Outbox skeleton.
  - `staff_actor` enum + `audit_log` (14 cols) + `outbox_events` (14 cols).
  - Migration `0002_superb_quicksilver.sql` (applied manually — drizzle-kit + Neon SSL).
  - RLS + `system_bypass` policies (with `NULLIF` fix — ADR-010).
  - REVOKE UPDATE/DELETE on `audit_log` (append-only — ADR-011).
  - 4 indexes: `idx_audit_tenant_created`, `idx_audit_entity`, `idx_outbox_pending`, `idx_outbox_seq`.
  - Helpers: `recordAudit(tx, entry)` + `enqueueOutbox(tx, event)` in `packages/db/src/`.
  - Integration tests (`test-p1-007.ts`): 6/6 PASS.

### Decisions
- ADR-008: bcryptjs مؤقتاً (Phase 10: Argon2id).
- ADR-009: In-memory lockout (Phase 2: Redis).
- ADR-010: RLS policies must use `NULLIF(current_setting('app.tenant_id', true), '')::uuid` (fixes 22P02).
- ADR-011: REVOKE UPDATE/DELETE works on owner because `relacl` becomes non-NULL → append-only enforced at DB level for `audit_log`.
