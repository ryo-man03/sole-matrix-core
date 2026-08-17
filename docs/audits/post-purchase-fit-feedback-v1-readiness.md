# Post-purchase / Fit Feedback V1 readiness

Status: **STATIC VERIFIED / LOCAL DB UNVERIFIED**

Date: 2026-08-18  
Stack base: `feat/release-intelligence-evolution-v1`  
Branch: `feat/post-purchase-fit-feedback-v1`

## Delivered boundary

- Additive migration `202608180002_post_purchase_fit_feedback.sql`; migrations 001–005 are unchanged.
- Owner-bound and idempotent `purchase_reports`, `fit_feedback`, `fit_preference_profiles`, and `product_events`.
- Composite ownership foreign keys prevent a purchase or fit row from referencing another user's Recommendation snapshot, Wishlist item, Owned sneaker, or Purchase report.
- Explicit Product actions are separate from Behavior analytics. Views and listing clicks require the latest Analytics consent in both the application and RLS boundary.
- Fit Preference Profile is a deterministic aggregate and is rebuilt only with current Behavior personalization consent.
- Purchase reports create an Owned sneaker and may include optional satisfaction. Fit feedback supports size, overall fit, toe room, width, heel, instep, same-size-again, and a bounded note.
- Fit Confidence V2 uses `strong / medium / limited / unknown`. Strong requires the same canonical model, compatible Audience, and a valid size record.
- Purchase Confidence separately exposes product identity, market match, condition clarity, shipping clarity, listing freshness, fit reference, and evidence warnings. Price is not a Confidence input.
- Versioned offline evaluation covers snapshot linkage, feedback counts, Top-k stability, diversity, canonical accuracy, Ryo coherence, and fit-warning correctness. It does not train a model.

## Invariants

- `app/_lib/core-v1/**` and `app/_lib/ryo-mode-v4/**` have no diff from the stack base.
- Full tests, including existing Core golden and Ryo coherence suites, pass.
- Purchase/fit/event writes take the authenticated user ID on the server; user IDs are never accepted from request bodies.
- Event persistence does not mutate Core/Ryo scores or recommendation ranking.
- UI copy uses `Preference Profileを更新しました`; it does not claim silent AI learning or guaranteed fit.

## Verification

| Gate | Result |
| --- | --- |
| TypeScript | PASS |
| Full Vitest | PASS — 144 files / 2,087 tests |
| Additive migration verification | PASS — 6 migrations |
| RLS migration tests | PASS — 168 tests |
| Security suite | PASS — 77 tests |
| Provider/market suite | PASS — 503 tests |
| Production build | PASS — 49 pages/routes generated |
| Playwright E2E | PASS — 4 tests |
| Playwright accessibility | PASS — 2 tests |
| Dependency audit | PASS — no known vulnerabilities |

The existing Turbopack NFT warning from `next.config.ts → globalFeedbackCorpus.ts` remains unchanged from the stack base.

No production migration, scheduler change, provider enablement, or production deployment was performed. Docker/local Postgres was unavailable, so schema execution and live RLS behavior remain unverified locally and must be validated in the approved migration environment before deployment.
