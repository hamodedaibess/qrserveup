# ADR-011: Append-Only via REVOKE on Owner

**Status:** Accepted
**Date:** 2026-11-09
**Context:** P1-007 (Audit Log)

## Problem

`audit_log` MUST be append-only (ERD §14.6). Traditional approach:

- `REVOKE UPDATE, DELETE ON audit_log FROM app_role`
- **BUT** if `app_role` is table **owner** → REVOKE traditionally ineffective (owner bypasses ACL)

In our setup, `qrserveup_app` owns the table (created it via migration).

## Hypothesis (wrong)

Owner bypasses REVOKE → append-only must be enforced at code level only.

## Reality (verified 2026-11-09)

PostgreSQL behavior (subtle):

- When `pg_class.relacl IS NULL` → owner has all privileges **implicitly** (ACL not enforced)
- After **any** `GRANT`/`REVOKE` → `relacl` becomes **non-NULL** → ACL enforced literally, **including on owner**

Therefore: `REVOKE UPDATE, DELETE FROM qrserveup_app` works — because the REVOKE itself makes `relacl` non-NULL.

Verified:

```sql
SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name='audit_log';
-- qrserveup_app: INSERT, SELECT, REFERENCES, TRIGGER, TRUNCATE
-- (UPDATE, DELETE missing)
```

And: `DELETE FROM audit_log` → `permission denied for table audit_log` (code `42501`) ✅

## Decision

For append-only tables:

1. Use `REVOKE UPDATE, DELETE ON <table> FROM PUBLIC`
2. Use `REVOKE UPDATE, DELETE ON <table> FROM qrserveup_app` (owner)
3. Verify via `pg_class.relacl IS NOT NULL` and `information_schema.table_privileges`

Trust REVOKE — no need for trigger-based append-only enforcement in Phase 1.

## Consequences

- ✅ Append-only enforced at DB level (defense in depth, beyond code)
- ✅ Tests (`test-p1-007.ts` TEST 6) verify `DELETE` fails with `42501`
- ⚠️ Manual cleanup of test rows requires `neondb_owner` (Neon SQL Editor)
- ⚠️ Future `staff_activity_log`, `order_transitions` (Phase 4+) should use same pattern

## References

- PostgreSQL: `pg_class.relacl`, owner privileges vs explicit ACL
- P1-007 `test-p1-007.ts` (TEST 6)
- HANDOFF "Known Issues" section