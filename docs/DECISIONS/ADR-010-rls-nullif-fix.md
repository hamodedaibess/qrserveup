# ADR-010: RLS Policies MUST Use NULLIF on app.tenant_id

**Status:** Accepted
**Date:** 2026-11-09
**Context:** P1-007 (Audit Log + Outbox)

## Problem

Policies created in P1-006 use:

```sql
tenant_id = current_setting('app.tenant_id', true)::uuid
```

After `withTenant(A)` transaction ends, PostgreSQL leaves `app.tenant_id = ''` (empty string, not NULL) in the session (SET LOCAL resets value but not the setting itself).

When `asSystem()` runs next, it sets `app.system_mode='true'` but leaves `app.tenant_id=''`. Then:

1. `system_bypass` policy evaluates → `true` (passes)
2. BUT `tenant_isolation` policy also evaluates → `''::uuid` → **throws `22P02 invalid input syntax for type uuid: ""`**
3. PostgreSQL OR's policy expressions — one exception aborts the whole query

**Symptom:** `INSERT` in `asSystem()` fails with `Failed query` + hidden `cause.code: '22P02'`.

## Decision

All tenant_isolation policies MUST use:

```sql
tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
```

`NULLIF('', '')` → `NULL` → `NULL::uuid` → `NULL`. Comparison `tenant_id = NULL` returns `NULL` (treated as false) — policy correctly rejects. No exception thrown.

## Consequences

- ✅ `asSystem()` works after `withTenant()` in same process
- ✅ No 22P02 exception
- ✅ Cross-tenant isolation intact (NULL rows hidden from tenants)
- ⚠️ **TODO (Phase 2):** Apply same fix to existing policies in `src/rls.ts` — currently only `audit_log` + `outbox_events` have it
- ⚠️ Existing 11 tables have latent same bug — not exposed yet because no flow does `asSystem` after `withTenant` on them

## References

- PostgreSQL doc: `current_setting(name, missing_ok)` — returns `''` for unset local variable that was SET LOCAL before
- HANDOFF "Known Issues" section
- P1-007 `test-p1-007.ts` (reveals this in TEST 3)