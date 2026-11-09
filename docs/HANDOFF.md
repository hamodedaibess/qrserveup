# QRServeUp — Project Handoff

## START HERE — READ THIS FIRST

- **Project Status:** Phase 1 — IN_PROGRESS (P1-003 DONE, P1-004 CURRENT).
- **Last Completed Task:** P1-003 (Auth email/password + sessions + bcryptjs).
- **Next Task:** P1-004 — Auth PIN + lockout.
- **Critical Blocker:** NONE.
- **Known constraints:**
  - bcryptjs بدل Argon2id (ADR-008) — مراجعة في Phase 10.
  - Lockout حالياً in-memory (Map) — يُنقل إلى Redis في Phase 2.
- **Environment:** GitHub Codespaces + Neon (Postgres 16).
