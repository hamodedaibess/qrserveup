# QRServeUp — CHANGELOG

## [Unreleased] — Phase 1 Foundation
### Added
- **P1-001:** Monorepo (pnpm + Turborepo + TS Strict).
- **P1-002:** Neon + Drizzle ORM. 16 tables + Seed.
- **P1-003:** Auth email/password (bcryptjs, ADR-008) + sessions.
- **P1-004:** PIN auth for staff. In-memory lockout: 5 fails → 15 min (ADR-009).

### Decisions
- ADR-008: bcryptjs مؤقتًا (Phase 10: Argon2id).
- ADR-009: In-memory lockout (Phase 2: Redis).
