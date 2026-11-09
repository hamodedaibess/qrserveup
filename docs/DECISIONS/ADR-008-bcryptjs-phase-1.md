# ADR-008: استخدام bcryptjs مؤقتًا بدل Argon2id

- **Status:** Accepted (Temporary)
- **Date:** 2026-11-09
- **Supersedes:** جزء من ADR-003 (خوارزمية التشفير فقط)
- **يعود إلى:** Argon2id في Phase 10 (قبل Pilot)

## القرار
نستخدم `bcryptjs` (JavaScript خالص، cost=12) مؤقتًا حتى Phase 10، بسبب فشل `@node-rs/argon2` المتكرر في Next.js Monorepo (native bindings).

## خطة الترحيل
Phase 10: نثبت argon2 في CI على Linux ثابت، نضيف `hash_algo` column، lazy rehash عند الدخول التالي.
