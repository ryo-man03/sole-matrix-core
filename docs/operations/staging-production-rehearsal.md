# Staging production rehearsal

Checked on 2026-08-20. This runbook authorizes only a separately identified, non-production Supabase project. It does not authorize a production database, deployment, role assignment, scheduler, notification, or provider write.

## Current discovery result

`STAGING PROJECT: UNAVAILABLE / USER ACTION REQUIRED`.

The repository has no GitHub Environment, repository Action secret/variable, Vercel project metadata, staging URL, staging project ref, or staging-to-repository mapping. Local configuration contains generic Supabase browser settings, but it has no staging designation and no independently recorded production project ref for comparison. Those generic values were not displayed and were not used for a remote connection.

The current evidence therefore satisfies neither the two-condition staging identity rule nor the explicit production-separation rule. Remote schema inspection, migration, test-user creation, Auth/RLS rehearsal, Data Steward assignment, internal-job invocation, backup, and rollback were not run.

## Fail-closed preflight

Run `pnpm staging:preflight` only after injecting environment-scoped values outside Git. The command deliberately does not load `.env.local`, prints presence/boolean state rather than values, and exits non-zero unless all connection gates pass.

Required identity and operator evidence:

| Name | Purpose | Required result |
| --- | --- | --- |
| `SOLE_MATRIX_ENVIRONMENT` | Explicit environment designation | exactly `staging` |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging public project URL | HTTPS; hostname matches the staging ref |
| `STAGING_SUPABASE_PROJECT_REF` | Staging identity | matches the URL hostname |
| `PRODUCTION_SUPABASE_PROJECT_REF` | Separation check only | present and different from staging |
| `STAGING_BACKUP_VERIFIED` | Operator confirmation | exactly `true` |
| `STAGING_ROLLBACK_PLAN_VERIFIED` | Operator confirmation | exactly `true` |
| `STAGING_DATA_REWRITE_APPROVED` | Reviewed 005 rewrite | exactly `true` |
| `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD` | CLI authorization | both present; never logged |

The runtime secret inventory also reports presence for the anon/publishable key, server key, internal-job secret, Gemini, Yahoo, eBay, and Rakuten settings. Provider credentials are optional for the database rehearsal and must remain disabled unless their separate bounded-smoke policy permits use.

## Migration preflight

`pnpm test:migrations` currently verifies seven ordered, transactional migrations and rejects `DROP TABLE`, `TRUNCATE`, or disabled RLS. The staging preflight adds fail-closed checks for `DROP COLUMN`, RLS disablement, destructive rename/type changes, and records reviewed data rewrites or constraint replacement without printing SQL bodies.

Current scan:

| Migration | Static result | Additional staging review |
| --- | --- | --- |
| 001 account persistence | PASS | additive |
| 002 preferences / collection | PASS | additive |
| 003 recommendation history | PASS | additive |
| 004 release / Daily Picks | PASS | additive |
| 005 release intelligence evolution | PASS WITH OPERATOR REVIEW | replaces one check constraint, rewrites legacy source-kind values, backfills fingerprints/timestamps, then adds not-null constraints |
| 006 post-purchase / fit feedback | PASS | additive |
| 007 Data Steward / quality | PASS | additive |

Hard blockers detected: 0. Migration 005 still requires a verified staging backup, schema/data snapshot, reviewed rewrite approval, and rollback decision before remote application. Its successful ephemeral-CI run does not waive those persistent-staging controls.

## Ordered rehearsal

1. Capture the project ref, hostname, environment designation, repository mapping, current schema, and migration history. Confirm the staging and production refs differ.
2. Verify an available backup/restore point and record the restore owner, RPO, RTO, retention, and encryption state. If unavailable, stop migration.
3. Run `pnpm staging:preflight` and retain only its value-free report. A `BLOCKED` result stops remote access.
4. Run `pnpm test:migrations`, inspect the 005 rewrite plan, and dry-run or restore a disposable clone if the platform supports it.
5. On a fresh staging database, apply 001 → 007 in order. On an existing staging database, prove checksums/history for already-applied files before applying only the remaining ordered files. Never edit an applied migration.
6. Confirm migration history is byte-identical and all seven entries are present once.
7. Create only staging test users A and B. Rehearse sign-up where policy permits, sign-in, sign-out, session restore, password-reset contract, unauthenticated denial, and authenticated access.
8. Run the real pgTAP suite and user A/B RLS probes: cross-user read, write, feedback, wishlist, owned sneaker, purchase, and fit-feedback linkage must all equal zero.
9. Assign Data Steward only to a named staging test account through the controlled server path. Anonymous and normal-user access must fail; steward access and audit entries must pass; self-escalation and private-user overreach must equal zero.
10. Run the critical UI flow: onboarding, preferences, diagnosis, recommendation, wishlist, owned sneaker, Fit Confidence, Purchase Confidence, manual Market search, purchase report, fit feedback, history, `/today`, and Admin Steward review.
11. Invoke release ingestion and Daily Picks explicitly with a staging-only HMAC secret. Verify scope, idempotency, replay denial, and that `/today` performs precomputed DB reads with provider calls equal to zero. Do not enable a scheduler.
12. Exercise manual release evidence draft → review → conflict → dedupe → catalog → Daily Pick handoff. Do not promote a marketplace listing to official evidence.
13. If provider terms and staging-scoped credentials permit, run at most one read-only bounded Yahoo/eBay smoke; run Rakuten only after its registered origin is verified. Provider failure must remain isolated from the application.
14. Rehearse application revision rollback. Classify database recovery as forward fix, feature disable, deployment rollback, or database restore; do not assume a down migration exists.
15. Run the full local and GitHub gate, inspect provider/data-quality state, and preserve a value-free operations log.

## Acceptance matrix

| Area | Required evidence | Current result |
| --- | --- | --- |
| Project identity | designation + ref/hostname + production difference | NOT RUN — staging unavailable |
| Migration 001–007 | ordered history and schema verification | NOT RUN on persistent staging; ephemeral CI PASS |
| Auth | staging test-user lifecycle | NOT RUN |
| RLS | user A/B and linkage counters all zero | NOT RUN on persistent staging; ephemeral pgTAP PASS |
| Admin RBAC | anonymous/user denied, steward allowed, escalation zero | NOT RUN on persistent staging; ephemeral pgTAP PASS |
| User flow | critical route list above | NOT RUN on staging; deterministic local E2E PASS |
| Daily Picks | provider call zero, signed explicit job, replay/idempotency | NOT RUN on staging; static/unit contracts PASS |
| Release ingestion | manual/review pipeline and conflict/dedupe handoff | NOT RUN on staging; static/unit contracts PASS |
| Backup / restore | mechanism, owner, RPO/RTO, restore evidence | UNVERIFIED |
| Rollback | previous app revision and recovery decision | UNVERIFIED |

## Operations log template

Record timestamp, operator, staging identifier fingerprint, action, migration names, test-user aliases, internal-job name/idempotency result, external request count/status, before/after schema fingerprint, rollback point, and outcome. Record credential values, raw provider bodies, queries, user identity, access tokens, and authorization headers: **0**.

