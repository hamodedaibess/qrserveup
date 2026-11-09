# QRServeUp — CHANGELOG

## [Unreleased] — Phase 1 Foundation
### Added
- **P1-001 (2026-11-09):** Monorepo setup (pnpm + Turborepo + TS Strict).
- **P1-002 (2026-11-09):** Neon + Drizzle ORM. 16 tables + Seed (Plans, Permissions, Platform Owner).
- **P1-003 (2026-11-09):** Auth email/password (bcryptjs cost=12, ADR-008). POST /api/auth/login → 200 + HttpOnly cookie session_id. Session persists in staff_sessions table.
