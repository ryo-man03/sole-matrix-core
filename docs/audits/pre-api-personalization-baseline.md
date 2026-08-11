# Pre-API personalization baseline

Baseline: `origin/main` at `a97f0bb15a7a5fb09afe2e6a06ccd08fdb5919f1` (2026-08-02).

## Inventory

- Next.js 16.2.11 / React 19.2.4 / pnpm 11.9.0.
- 108 Vitest files and 1,072 passing tests.
- 23 application routes/pages; typecheck and production build pass.
- Authentication used hand-written Supabase Auth REST calls and bespoke access/refresh cookies. It had no middleware refresh, callback, password reset, or Server Component user guard.
- Personal memory used `data/users/{userId}/memory.md`; this remains a development-only compatibility source and must never be a production fallback.
- Recommendation feedback had global/local persistence seams but no per-user database snapshot repository.
- There were no Supabase migrations, database RLS tests, structured profile/preferences/collection tables, consent records, privacy request flow, release catalog, or daily-pick batch.
- Existing recommendation, Ryo coherence, colorway verification, and market boundaries are invariants. This program does not alter Core ranking or make release-provider requests.

## Strangler plan

New domain/application/infrastructure modules own persisted account data. Existing `app/_lib` callers remain available behind adapters while routes move incrementally. Authentication identity is always derived from `supabase.auth.getUser()`, never request JSON. Database failures are soft for recommendation display. Production never writes personal data to the repository filesystem.

## Migration risk and rollback

Migrations are additive. Rollback is application rollback first; tables remain intact to prevent data loss. Destructive rollback SQL is intentionally not automated. A later, separately approved cleanup may remove unused tables only after export and retention review.
