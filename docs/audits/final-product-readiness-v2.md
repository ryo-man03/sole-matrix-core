# SOLE//MATRIX final product readiness v2

Audit date: 2026-08-18

Baseline: `origin/main` at `ef31341`

Stack: PR A `#38` → PR B `#39` → PR C `#40` → PR D → PR E

Verification status: **STATIC VERIFIED / LOCAL DB UNVERIFIED**

## Decision

**SOLE//MATRIX FINAL PRODUCT FOUNDATION READY FOR PRODUCTION INTEGRATION REVIEW**

This decision covers the code foundation and the stacked review artifacts. It is not a production deployment claim. No production migration, deployment, scheduler change, notification, provider write, role assignment, or import was performed.

## Baseline and final gates

| Gate | Baseline | Final |
| --- | ---: | ---: |
| Full Vitest | 132 files / 1,947 tests | 157 files / 2,343 tests |
| Meaningful deterministic increase | — | +396 tests |
| Provider suite | 488 tests | 569 tests |
| Security detector suite | 77 tests | 112 tests |
| RLS/static database suite | 117 tests | 184 tests |
| Migrations | 4 | 7 additive, transactional migrations |
| TypeScript | PASS | PASS |
| Production build | PASS | PASS, 52 generated pages in the build phase |
| Browser E2E | 4 | 5 |
| Accessibility E2E | 2 | 2 |
| Dependency audit | 0 known vulnerabilities | 0 known vulnerabilities |

The build retains one pre-existing Turbopack NFT trace warning from `next.config.ts` to the development-only local feedback corpus. It does not cause a compile, route, browser, hydration, or test failure.

Docker is unavailable in this environment. The migration order, SQL invariants, constraints, grants, and RLS policies were statically verified; real PostgreSQL migration application and user A/B RLS execution remain unverified locally.

## Architecture disposition

| Decision | Result |
| --- | --- |
| KEEP | TypeScript Core Decision, Ryo scoring and reranking, session-derived identity, Supabase owner boundaries, explicit manual Market action |
| EXTEND | Release evidence/conflict model, purchase and fit feedback, Daily Picks DB boundary, Data Steward RBAC, quality metrics, request-scoped provider observations |
| CONSOLIDATE | HTTPS-only URL validation, bounded request-body parsing, exact-field validation, cache/single-flight metrics, cross-domain readiness tests |
| DELETE | No production subsystem was deleted; no speculative infrastructure was added |

Kafka, RabbitMQ, Pub/Sub, Airflow, Kubernetes, Snowflake, BigQuery, microservices, Redis, and vector databases were not introduced.

## Provider status

| Provider | Implementation / policy | Exact status |
| --- | --- | --- |
| Rakuten | Ichiba Item Search `2026-07-01`; Application ID and Access Key present; registered request origin absent | **UNAUTHORIZED**; live normalization unverified |
| Yahoo! Shopping | v3 item search; temporary current-retail display only | last bounded evidence: live verified, 4 normalized |
| eBay | Browse API; server-only in-memory application token; current listing display only | last bounded evidence: live verified, 10 normalized; persistent writes 0; forecast use 0 |
| StockX | official v2 adapter remains approval/credential gated; catalog reference cannot become official release evidence | `CREDENTIAL_MISSING`; no request in this goal |
| alias | no approved token or integration | `APPROVAL_PENDING`; no request in this goal |

Rakuten root cause is exact: the allowlisted application requires HTTP referrer context, but `RAKUTEN_REQUEST_ORIGIN` is absent. The adapter derives `Origin` and root `Referer` from that server-only value. A successful bounded smoke still requires the exact registered origin.

**AUTHORIZED AUTOMATED RELEASE PROVIDER NOT YET AVAILABLE. MANUAL / REVIEW PIPELINE READY.** Marketplace listings never promote themselves to `brand_official` release evidence.

## Release Intelligence

- Migration `202608180001_release_intelligence_evolution.sql` is additive; migrations 001–004 are unchanged.
- Evidence keeps provider, canonical origin, independent-source key, content fingerprint, observed date/state, review and verification state, first/last seen, and supersession data.
- Official, retailer, editorial, rumor, released, restocked, cancelled, date-changed, unknown, conflict, duplicate, same-source reprint, partial Style Code, generation, audience, and region boundaries are deterministic fixtures.
- Evidence order does not change resolution. Duplicate sources do not increase independent-source count. Conflicting dates resolve to no invented date.
- The required caution is visible: `発売日は情報源によって異なります`.
- Manual release/evidence entry is staging-only and requires Data Steward review. Production catalog writes are not performed by CSV preview or manual draft creation.

## Feedback, Fit, and purchase confidence

- Migration `202608180002_post_purchase_fit_feedback.sql` is additive and owner-bound.
- Events distinguish explicit product actions from behavior analytics; analytics consent can disable behavior events without blocking explicit purchase/fit feedback.
- Purchase reports and fit feedback are idempotent, linked to owner-controlled rows, and protected by both database relationships and RLS.
- Fit Confidence V2 emits `strong`, `medium`, `limited`, or `unknown`; strong requires compatible audience, canonical model identity, and usable size history.
- Purchase Confidence covers product identity, listing match, condition, shipping, fit reference, and freshness. Price does not mutate recommendation or Ryo scores.
- A permitted fit-personalization update uses the exact copy `Preference Profileを更新しました`.
- Offline evaluation is versioned, deterministic under order changes, and replay-idempotent.

## Admin and data quality

- Migration `202608180003_data_steward_quality.sql` is additive and enables RLS on every new table. Authenticated and anonymous table grants are not added; server-side authorization uses `getUser()` plus `is_data_steward()`.
- Admin routes: providers, releases, evidence, conflicts, data quality, and import preview.
- Anonymous and normal users are denied. Client flags do not grant access. Audit rows contain actor, action, entity, request ID, and before/after fingerprints without raw credentials or provider bodies.
- Data quality follows Observation → Metric → Threshold → State for provider, release, and aggregate user-quality data.
- Provider observations now retain request-scoped `hit`, `miss`, `bypass`, and `single_flight_hit` state without query text, user identity, item URL, token, or raw response.
- CSV is preview-only, capped at 256 KiB / 500 rows, exact-column validated, and rejects formula cells, unsafe URLs, invalid dates/enums, duplicates, and unexpected columns.

## Performance measurements

Measurements use a production build and the same deterministic browser fixture. Browser timings are local observations, not service-level objectives.

| Measurement | Before PR E | After PR E | Interpretation |
| --- | ---: | ---: | --- |
| Recommendation result initial render | 3,920 ms | 3,868 ms | no material regression; 52 ms lower in the dedicated run |
| Manual Market result | 153 ms | 188 ms | 60 ms provider fixture plus browser variance; bounded below 500 ms |
| Provider parallel boundary | 60 ms shared gate | 60 ms shared gate | three operations start before release; not 3 × sequential latency |
| `/today` data calls | 1 HTTP / 1 nested DB read | 1 / 1 | unchanged and bounded |
| Duplicate Market requests | 0 | 0 | manual action produces one request |
| Cache | existing in-memory contract | second equivalent request is a measured hit | underlying provider calls remain 1 |
| Single-flight | existing contract | concurrent equivalent requests reuse one flight | one reuse event is observable |
| Admin table queries | provider/release/evidence 2; conflict/audit 1; quality 13 parallel | same | bounded, parallel where count >1 |
| Client JS chunks | 20 / 890.5 KiB | 20 / 891.1 KiB | +0.6 KiB (+0.08%) |

The full two-worker E2E run also passed with recommendation 4,446 ms and Market 182 ms; the dedicated one-worker before/after values above are used for the comparison.

## Security result

- Server-fetched external URLs are HTTPS-only. HTTP, JavaScript/data/file/FTP, credentials, non-standard ports, localhost, private/reserved IPv4 and IPv6, link-local, metadata addresses, tunnel hosts, and redirect-to-private are rejected.
- Provider-normalized browser links reject literal private/reserved IPv4, all literal IPv6 destinations, metadata/local hostnames, unsafe protocols, credentials, and non-standard ports.
- JSON and raw request readers enforce actual streamed byte limits rather than trusting `Content-Length`; excessive depth/node count and `__proto__` / `prototype` / `constructor` pollution keys are rejected.
- Critical mutation, auth, recommendation, collection, feedback, admin, internal-job, CSV, and multipart image paths use bounded parsing. Domain parsers use exact allowed fields and map database rows explicitly, preventing mass assignment.
- Identity and ownership for production user data come from the server session. Body/query `userId` is not used as an ownership decision. Legacy local-memory user routes return 410 in production.
- Secrets remain server-only and are absent from client code, API bodies, error bodies, audit rows, docs, and committed diffs.

All required active detector values in the repository fixture are derived and equal zero:

```text
secretExposureCount=0                 clientCredentialBundleCount=0
crossUserReadCount=0                  crossUserWriteCount=0
crossUserFeedbackLinkCount=0          coreMutationFromMarketCount=0
ryoMutationFromMarketCount=0          marketplaceOfficialPromotionCount=0
partialStyleCodeAcceptedCount=0       generationMismatchCount=0
audienceMismatchCount=0               ebayPersistentWriteCount=0
ebayForecastUseCount=0                autoProviderLoginCount=0
autoProviderTodayCount=0              releaseConflictHiddenCount=0
duplicateEvidenceLostCount=0          unauthorizedAdminAccessCount=0
fitGuaranteeClaimCount=0              medicalClaimCount=0
```

Every detector also has a corresponding broken fixture that produces a value greater than zero; the counters are not constant-zero assertions.

## UX and browser result

- Recommendation first view keeps Decision, why, product verification, Fit Confidence, Purchase Confidence, and the manual Market action together.
- Domestic Rakuten/Yahoo retail and international eBay listings are separate groups. Related listings remain collapsed; new/used and each currency have separate summaries.
- Release state, date, region, confidence, staleness, and conflict are visible while technical evidence stays collapsed.
- 320–1,920 px result checks: overflow 0. Console/page/hydration errors: 0. Primary touch targets and page landmarks: PASS. Accessibility E2E: 2/2.

## Remaining production work

- **PRODUCTION DATA LAYER NOT DEPLOYED.**
- **PRODUCTION APPLICATION NOT DEPLOYED.**
- Apply migrations 005–007 in a non-production rehearsal before any production approval.
- Assign Data Steward roles through a controlled, audited process; no role was assigned here.
- Configure internal-job HMAC secrets and scheduler only after deployment review; no scheduler was created here.
- Add the exact registered Rakuten origin and run one bounded read-only smoke; do not relabel Rakuten until normalization succeeds.
- Onboard an automated Release Provider only after operation-specific authorization is recorded.
