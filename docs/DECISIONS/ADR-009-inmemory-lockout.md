# ADR-009: In-Memory Lockout للـ PIN (مؤقت)

- **Status:** Accepted (Temporary)
- **Date:** 2026-11-09
- **Returns to:** Redis-backed lockout في Phase 2

## القرار
Lockout PIN يُحفظ في Map داخل process الـ web (Node.js).

## القيود المعروفة
- عند إعادة تشغيل السيرفر أو تعدد instances → يُفقد الـ lockout.
- لا يشترك بين الـ replicas.

## الترقية إلى Redis في Phase 2
- استخدام `@upstash/redis` (Free tier).
- key: `lockout:{tenantId}:{staffId}` → TTL 15 دقيقة.
- atomic INCR + EXPIRE.
