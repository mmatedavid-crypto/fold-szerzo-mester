
# Földbérleti Szerződés Generátor — MVP build plan

This is a large product. I'll deliver it in phases as you specified. This plan covers **Phase 1** end-to-end and scaffolds the data model + admin shell so Phase 2/3 plug in cleanly. Phases 2 and 3 will be separate follow-up plans.

## Stack

- TanStack Start (already scaffolded) + Tailwind + shadcn/ui
- Lovable Cloud (Supabase) for DB, auth, storage, server functions
- Server-side PDF generation via `createServerFn` using `pdf-lib` (Worker-compatible)
- Payment abstraction layer with a `MockProvider` implementation; Stripe/Barion/SimplePay plug in later
- Hungarian copy throughout, mobile-first

## Phase 1 scope (this plan)

Pages built:
- `/` landing (hero, benefits, pricing cards, CTAs)
- `/arak` pricing
- `/belepes`, `/regisztracio` (email/password + Google)
- `/dashboard` documents list + remaining quota
- `/szerzodes/uj` wizard (steps 1–6, autosave drafts)
- `/szerzodes/:id/ellenorzes` risk report (no contract text shown)
- `/szerzodes/:id/fizetes` mock payment / quota consumption
- `/szerzodes/:id/kesz` download final PDF
- `/dokumentum-ellenorzes` verify by ID + hash
- `/admin` shell (gated by `has_role('admin')`) — clause library + template versions CRUD; other admin tabs stubbed
- `/kifuggesztesek`, `/berleti-dij-iranytu` — placeholder pages with "hamarosan" copy (full build in Phase 3)

Wizard step 7 (legal risk check) is computed server-side from draft JSON; step 8 (payment) and step 9 (final PDF) are wired.

## Data model (Supabase migration)

All tables from your spec are created with RLS + grants:

- `users_profile`, `plans` (seeded: Egy szerződés / Gazda / Pro), `subscriptions`, `document_credits`
- `contract_drafts`, `generated_documents`, `payments`
- `legal_template_versions`, `clauses`
- `notices` (Phase 3 — table only)
- `usage_logs`, `document_verifications`
- `user_roles` table + `app_role` enum + `has_role()` security-definer function (admin gating)

RLS: users see only their own rows; admin role bypasses for management tables. Generated PDFs go to a private storage bucket; downloads via signed URLs from a server function that re-checks ownership.

## Business rules (server-side, in `src/lib/contracts/`)

- `riskCheck(draft)` → returns categorized findings (`rendben` / `figyelmeztetés` / `jogi ellenőrzést igényel` / `hiányzó kötelező adat`)
- `preLeaseRank(answers)` → suggested rank + required proofs + clause text
- `composeContract(draft, templateVersion, clauses)` → final text assembled from clause library
- `coreFieldsHash(draft)` → SHA-256 over lessor/lessee/parcels/rent model/term/pre-lease basis; changing these requires a new credit
- `canFinalize(user)` → checks active subscription quota OR available `document_credits` row
- `consumeCredit(user, documentId)` → atomic RPC

## Anti-copy enforcement

- Wizard frontend never receives composed contract text. Only form summary + risk report + section list + a server-rendered **blurred watermarked PNG preview** (1 page, low-res, diagonal watermark "MINTA — NEM ÉRVÉNYES").
- Final composition + PDF only inside `finalizeDocument` server function, gated by `canFinalize` + payment status.
- PDF footer on every page: `foldberletiszerzodes.hu | Dokumentum ID: {id} | Generálva: {date} | Sablonverzió: {v} | Klauzulacsomag: {cv}` + QR to `/dokumentum-ellenorzes?id=...`
- Immutable `generated_documents` row with `document_hash`; verification page recomputes and matches.
- Duplicate-as-new flow creates a new draft pre-filled but always charges a credit on finalize.
- `usage_logs` written on draft create, finalize, download, verify; admin "suspicious usage" view = SQL view over logs (same parties, >N parcels in 24h).

## Payments (Phase 1 = mock)

- `PaymentProvider` interface: `createCheckout({userId, productType, amount})`, `verifyWebhook(req)`, `getStatus(paymentId)`
- `MockProvider`: `/api/public/payments/mock-webhook` route auto-marks payment paid after redirect; clearly labeled "DEMO fizetés" in UI
- On success: insert `payments` row + either `document_credits` (single) or `subscriptions` (recurring), then redirect to `/szerzodes/:id/kesz`
- Billing data form (magánszemély/cég, név, cím, adószám, email, telefon) collected before checkout
- Prices displayed `bruttó` by default (admin-configurable flag in `plans`)

## Design

- Palette: natural green (`oklch` token `--primary` ~ deep olive), off-white background, dark slate text
- Typography: Inter body, DM Serif Display headings (warm, trustworthy)
- Mobile-first, large touch targets, autosave drafts every 5s with toast confirmation
- Step progress indicator across wizard

## Technical layout

```text
src/
  routes/
    index.tsx, arak.tsx, belepes.tsx, regisztracio.tsx
    dokumentum-ellenorzes.tsx, kifuggesztesek.tsx, berleti-dij-iranytu.tsx
    _authenticated/
      route.tsx (integration-managed gate)
      dashboard.tsx
      szerzodes.uj.tsx
      szerzodes.$id.ellenorzes.tsx
      szerzodes.$id.fizetes.tsx
      szerzodes.$id.kesz.tsx
    _authenticated/_admin/
      route.tsx (has_role gate)
      index.tsx, sablonok.tsx, klauzulak.tsx
    api/public/payments/mock-webhook.ts
  lib/
    contracts/{riskCheck,preLease,compose,hash,credits}.functions.ts
    contracts/*.server.ts (PDF gen, clause composition)
    payments/{provider,mock}.ts
    payments/checkout.functions.ts
  components/
    wizard/ (Step1Felek, Step2Foldterulet, Step3Idotartam, Step4Dij, Step5Eloberlet, Step6Klauzulak)
    pricing/, layout/, ui/ (shadcn)
supabase/migrations/<ts>_initial.sql
```

## What's NOT in Phase 1 (will be separate plans)

- Real Stripe/Barion/SimplePay integration (Phase 2)
- hirdetmenyek.gov.hu adapter + scheduled fetch + normalization (Phase 3)
- Bérleti díj iránytű analytics with real data (Phase 3)
- Full admin: pricing CMS, suspicious usage detailed UI, site content CMS, hirdetmény logs (Phase 2)

Pages for those exist as routed placeholders so navigation works end-to-end.

## Open questions before I start

1. **Auth providers**: Email/password only, or also Google sign-in? (Default: both)
2. **Admin seed**: After I run the migration, I'll need to manually promote your account to `admin` via SQL — confirm you want me to add a one-off script you can run, or I can hardcode promotion for the first registered email if you give it to me.
3. **PDF preview blur**: Server-rendered PNG with watermark is heavier than a pure CSS blur of section titles. OK to start with section-list + non-copyable watermarked summary block (no full text ever generated pre-payment), and add rendered preview image in Phase 2?
4. **Lovable Cloud**: I'll enable it as the first step — confirm.

Reply with answers (or "go ahead with defaults") and I'll switch to build mode and start with the migration + auth + landing/pricing, then the wizard, then payment + PDF.
