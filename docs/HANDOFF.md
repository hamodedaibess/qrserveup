# QRServeUp — Handoff Document
# آخر تحديث: 2026-11-09 (نهاية الجلسة الثانية — بعد P1-007)

## 🎯 الغرض
يُقرأ أولاً في أي محادثة جديدة. أرسله للـ AI الجديد مع: "اقرأ هذا الـ Handoff وأكمل من حيث توقفنا".

---

## 📌 معلومات المشروع

- **الاسم:** QRServeUp — Multi-tenant SaaS Restaurant OS
- **الهدف:** إدارة وردية مطعم كاملة بدون فقدان طلبات، بدون فروقات مالية، بدون تسريب بيانات
- **الموقع:** Phase 1 (Foundation) — 7 من 10 مهام مكتملة
- **المعمارية:** Modular Monolith في Monorepo
- **السوق:** مصر (MVP)، ثم السعودية والإمارات

### القرارات المعمارية (ADRs)
- ADR-001/002: Multi-tenant + RLS + DAL (PostgreSQL)
- ADR-003: Auth email/password (owner) + PIN (ops)
- ADR-004: Socket.IO standalone
- ADR-005: Transactional Outbox
- ADR-006: Financial = NUMERIC(18,4)
- ADR-007: Tenant URL = path-based /t/<slug>
- ADR-008: bcryptjs مؤقتاً (Phase 10 → Argon2id)
- ADR-009: Lockout PIN in-memory (Phase 2 → Redis)
- **ADR-010:** RLS policy MUST use `NULLIF(current_setting('app.tenant_id', true), '')::uuid` — بدون ذلك `asSystem` بعد `withTenant` يفشل بـ `22P02 invalid input syntax for type uuid: ""`
- **ADR-011:** `qrserveup_app` owner للجداول، لكن REVOKE UPDATE/DELETE يعمل فعلياً (relacl غير NULL → ACL يُطبّق على owner). Append-only على `audit_log` مفعّل على مستوى DB.

---

## 💻 بيئة العمل

- **جهاز المالك:** Windows 8.1 + HDD (لا Docker/Node 20+)
- **بيئة التطوير:** GitHub Codespaces — ريبو `hamodedaibess/qrserveup`
- **DB:** Neon Postgres 16 — مشروع `qrserveup` — AWS US East 2 (Ohio)
- **Node:** v24.22.2 | **pnpm:** 12.16.1 | **Next.js:** 15.0.0

### قيود Neon المهمة
- `neondb_owner`: `BYPASSRLS=true` — **للـ migrations اليدوية فقط**
- `qrserveup_app`: **لا** BYPASSRLS — للتطبيق. كلمة المرور: `qrserveup_app_dev_2026`
- `qrserveup_app` يحتاج `GRANT CREATE ON SCHEMA public` (تم عبر Neon SQL Editor)
- `qrserveup_app` هو **owner** لـ `audit_log` + `outbox_events` لكن REVOKE يعمل (ADR-011)

---

## 🗂️ بنية المشروع (محدّثة)

```
apps/web, realtime, workers
packages/{tsconfig,eslint-config,types,db,auth,rbac}
packages/db/src/
  ├── schema.ts          (18 جدول، 268 سطر)
  ├── dal.ts             (withTenant/asSystem)
  ├── rls.ts             (تطبيق RLS على 11 جدول + tenants)
  ├── audit.ts           (جديد P1-007) — recordAudit()
  ├── outbox.ts          (جديد P1-007) — enqueueOutbox()
  ├── test-p1-007.ts     (جديد P1-007) — 6 integration tests
  ├── seed.ts, index.ts
packages/db/drizzle/
  ├── 0000_worthless_moondragon.sql
  ├── 0001_steady_warstar.sql
  └── 0002_superb_quicksilver.sql  (staff_actor enum + audit + outbox)
```

---

## ✅ ما تم إنجازه (Phase 1)

### P1-001 ✅ Monorepo + pnpm + Turborepo + TS Strict
### P1-002 ✅ Neon + Drizzle + 16 tables + Seed
- 16 جدول من ERD (Platform + Subscriptions + Tenant)
- Seed: Plans, Permissions, Platform Owner (admin@qrserveup.com / password123), Demo Tenant (demo-restaurant), Demo Staff (PIN 1234)

### P1-003 ✅ Auth (email+password) + sessions (bcryptjs, ADR-008)
- `POST /api/auth/login` → 200 + session_id cookie

### P1-004 ✅ PIN auth + lockout
- `POST /api/auth/pin` → 200/401/429
- 5 fails → 15 min lockout (in-memory, ADR-009)

### P1-005 ✅ RBAC package
- `can()`, `canAny()`, `canAll()`, `canInBranch()`, `computeStaffContext()`

### P1-006 ✅ RLS + DAL + Cross-tenant isolation
- RLS على 11 جدول + tenants (via `src/rls.ts`)
- `withTenant(id, cb)` + `asSystem(cb)`
- Cross-tenant test PASS

### P1-007 ✅ Audit Log + Outbox Skeleton

**ما تم:**
1. **Schema:** `staff_actor` enum + `audit_log` (14 عمود) + `outbox_events` (14 عمود)
2. **Migration 0002:** `drizzle-kit generate` → `0002_superb_quicksilver.sql`
   - طُبّقت يدوياً عبر `pg` client (drizzle-kit migrate فشل بسبب SSL/Neon — انظر "مشاكل")
3. **RLS + system_bypass** على الجدولين (مع NULLIF fix — ADR-010)
4. **REVOKE UPDATE/DELETE** على `audit_log` (append-only — ADR-011)
5. **4 Indexes:** `idx_audit_tenant_created`, `idx_audit_entity`, `idx_outbox_pending`, `idx_outbox_seq`
6. **Helpers:**
   - `packages/db/src/audit.ts` — `recordAudit(tx, entry)` → returns id
   - `packages/db/src/outbox.ts` — `enqueueOutbox(tx, event)` → returns id
7. **Integration tests** (`src/test-p1-007.ts`) — 6/6 PASS:
   - TEST 1: RLS tenant isolation (tenant sees own) ✅
   - TEST 2: Cross-tenant isolation (0 rows) ✅
   - TEST 3: system_bypass sees all ✅
   - TEST 4: tenant A can't see null-tenant rows ✅
   - TEST 5: outbox isolation ✅
   - TEST 6: append-only enforced (DELETE blocked by REVOKE) ✅

---

## 📍 أين توقفنا

- **آخر مهمة مكتملة:** P1-007 ✅
- **التالي:** P1-008 — CI + Sentry + OTel
- **صفوف الاختبار:** cleaned manually via Neon SQL Editor

---

## 🎯 المهام المتبقية في Phase 1

### P1-008 ⏳ CI + Sentry + OTel (التالي)
- GitHub Actions workflow: lint + type-check + test
- Sentry SDK integration
- OpenTelemetry spans

### P1-009 ⏳ Testing infra
- Vitest setup لكل حزمة
- Playwright setup
- أول اختبارات آلية (نقل `test-p1-007.ts` إلى Vitest)

### P1-010 ⏳ Vertical slice
- صفحة `/login` حقيقية (Next.js page)
- صفحة `/dashboard` بعد الدخول
- Middleware يحمي `/dashboard` (session_id)
- E2E test بـ Playwright

---

## 🔧 مهام فورية في بداية الجلسة القادمة

### 1) تحقق من حالة الريبو
```bash
cd /workspaces/qrserveup && git log --oneline -5 && git status
```

### 2) تشغيل السيرفر
```bash
cd /workspaces/qrserveup && pnpm --filter @qrserveup/web dev
```

### 3) اختبار سريع
```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@qrserveup.com","password":"password123"}' -i
```

### 4) تشغيل integration tests
```bash
cd /workspaces/qrserveup/packages/db && pnpm exec tsx src/test-p1-007.ts
```
المتوقع: 6/6 PASS

---

## 🚨 مشاكل معروفة وحلولها

| المشكلة | السبب | الحل |
|---|---|---|
| `Cannot find native binding` (argon2) | @node-rs/argon2 فشل في Monorepo | bcryptjs (ADR-008) — لا تعد إليه |
| `DATABASE_URL is missing` | dotenv بمسار نسبي | index.ts يبحث في 4 مسارات |
| `SET LOCAL app.tenant_id = $1` fails | PostgreSQL لا يقبل $1 في SET LOCAL | استخدم `SELECT set_config(...)` |
| RLS لا يعمل | neondb_owner فيه BYPASSRLS | نستخدم qrserveup_app |
| `tsx not found` | كل حزمة تحتاج tsx | `pnpm --filter @qrserveup/<pkg> add -D tsx` |
| `@qrserveup/xxx fails on pnpm add` | pnpm يبحث في npm registry | `--workspace` أو `workspace:*` |
| `permission denied for schema public` | PG15+ لا يمنح CREATE على public | `GRANT CREATE ON SCHEMA public TO qrserveup_app` (Neon SQL Editor) |
| `drizzle-kit migrate` عالق/لا يطبع النجاح | SSL + Neon transaction timeout | تطبيق يدوي عبر `pg` client (انظر أدناه) |
| `invalid input syntax for type uuid: ""` | `current_setting` يرجع `''` بعد transaction | استخدم `NULLIF(..., '')::uuid` في policy (ADR-010) |
| `Cannot find package 'pg' from /tmp/...` | سكربت في `/tmp` لا يرى node_modules | ضع السكربت داخل `packages/db/` |
| `ERROR: Multiple exports with same name` | heredoc التصق مرتين | تحقق `grep -c` قبل كل `sed`/heredoc |
| الأوامر الطويلة تُلصق مبتورة | مشكلة Codespace terminal | استخدم VS Code مباشرة للملفات الطويلة، أو heredoc ≤ 20 سطر |

### نمط "تطبيق migration يدوياً" (عندما يفشل drizzle-kit)

```javascript
// packages/db/apply-XXXX.mjs
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '../../.env.local' });
const sql = fs.readFileSync('drizzle/0002_superb_quicksilver.sql', 'utf8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
for (const s of statements) { await c.query(s); console.log('OK:', s.slice(0, 60)); }
await c.end();
// ثم rm apply-XXXX.mjs (لا تـ commit)
```

---

## 🔑 بيانات الدخول والاختبار

**Platform Owner:**
- Email: admin@qrserveup.com
- Password: password123

**Demo Staff (Waiter):**
- PIN: 1234
- Tenant: demo-restaurant (slug)
- Tenant ID: 01a1c1a0-9fb6-7b72-912f-3a30c8f08316
- Staff ID: 01a1c1a0-a07e-7eb0-9fcb-38697000ef34

**Tenant B (Cross-tenant):**
- Slug: tenant-b
- Tenant ID: 01a1c1aa-49c9-7409-bc4f-d2a2f43b75cf
- Staff: B Staff (PIN 9999)

---

## 📚 ملفات مرجعية بالترتيب

1. `docs/HANDOFF.md` (هذا الملف)
2. `docs/MASTER_CHECKLIST.md`
3. `docs/CHANGELOG.md`
4. `docs/DECISIONS/ADR-008-bcryptjs-phase-1.md`
5. `docs/DECISIONS/ADR-009-inmemory-lockout.md`
6. `docs/DECISIONS/ADR-010-rls-nullif-fix.md` (جديد)
7. `docs/DECISIONS/ADR-011-append-only-revoke.md` (جديد)
8. ERD: `QRServeUp-ERD.md` (اطلبه من المالك إن احتجت)

---

## 🎯 رسالة جاهزة للـ AI الجديد

```
مرحباً، أنا مالك مشروع QRServeUp. سأرفق لك Handoff Document.
اقرأه بالكامل أولاً، ثم:
1. أكد لي أنك فهمت الحالة (باختصار شديد).
2. ابدأ بـ P1-008 (CI + Sentry + OTel).
3. اطلب مني أي معلومات ناقصة قبل البدء.

قواعد إلزامية:
- لا كود قبل خطة معتمدة
- لا تفترض وجود ملف دون فحصه
- تحقق من كل خطوة قبل الانتقال للتالية
- أوامر قصيرة أو استخدم VS Code للملفات الطويلة
- حدّث HANDOFF + CHECKLIST + CHANGELOG في نهاية كل مهمة
```

---

## 📊 إحصاءات الجلسة الثانية

- **المدة:** ~3 ساعات
- **المهام المكتملة:** 1 (P1-007)
- **الجداول في DB:** 18 (16 + 2)
- **الملفات المُنشأة:** 5 (`audit.ts`, `outbox.ts`, `test-p1-007.ts`, migration 0002, policy fix)
- **الاختبارات الناجحة:** 6/6 في P1-007
- **الأخطاء التي تجاوزناها:** 8+ (sed تكرار، heredoc قطع، GRANT CREATE، drizzle migrate عالق، NULLIF fix، إلخ)

---

## ⚠️ ملاحظة للمالك قبل إغلاق Codespace

1. احفظ هذا الملف محلياً
2. `git add . && git commit -m "..." && git push`
3. **Stop** Codespace (لا تحذفه)
4. عند العودة: Resume → `pnpm install` → `pnpm --filter @qrserveup/web dev`