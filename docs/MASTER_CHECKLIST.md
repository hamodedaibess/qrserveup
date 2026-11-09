# QRServeUp — Master Checklist

## Phase 1 — Foundation  [~] IN_PROGRESS

- [x] P1-001 Monorepo + pnpm + Turborepo + TS Strict (2026-11-09)
- [x] P1-002 Neon + Drizzle + 16 tables + Seed (2026-11-09)
- [x] P1-003 Auth (email+password) + sessions (2026-11-09)
  - [x] bcryptjs (cost=12) — ADR-008
  - [x] POST /api/auth/login → 200 OK + session_id cookie
- [~] P1-004 Auth (PIN) + lockout ← CURRENT
- [ ] P1-005 RBAC + permissions package
- [ ] P1-006 Multi-tenant context + RLS + DAL base
- [ ] P1-007 Audit Log + Outbox skeleton
- [ ] P1-008 CI + Sentry + OTel
- [ ] P1-009 Testing infra (Vitest + Playwright)
- [ ] P1-010 Vertical slice: login → dashboard + E2E
