# Production integration and deployment review

Checked on 2026-08-20. This is the operational handoff for the reviewed code stack. It does not authorize a production deployment, database change, scheduler, notification, external-provider write, secret insertion, role assignment, or account mutation.

## Review decision

- Application foundation: **COMPLETE**.
- Main integration baseline: **COMPLETE** at `245d3f354dbb8c48dbac77dfe98a225ef164d2d3`.
- Real database execution: **REAL EPHEMERAL SUPABASE VERIFIED**; migrations 001–007 and 65 pgTAP assertions passed in the required GitHub workflow.
- Persistent staging rehearsal: **NOT RUN** because no separately identified staging project is available.
- Production deployment review package: **COMPLETE**.
- Production go/no-go: **NO-GO / external operator decisions and rehearsals pending**.
- Production mutations performed by this review: **0**.

The one authoritative readiness result and consolidated external-action list are in [Production Readiness Program Report](../audits/production-readiness-program-report.md). Historical audits remain evidence for their own dates, not the current source of truth.

## Deployment order

1. Merge the reviewed PR stack in order only after approval and all fresh required checks pass. Confirm migrations 001–004 are byte-identical to their already-reviewed versions.
2. Complete the [staging production rehearsal](staging-production-rehearsal.md). Fresh staging applies 001–007 in order; existing staging proves immutable history before applying only unapplied migrations.
3. Prove Auth, user A/B RLS isolation, cross-user linkage zero, Data Steward allow/deny, critical UI flow, signed internal jobs, provider isolation, backup, restore, and application rollback in staging.
4. Approve the canonical production domain, hosting platform, Supabase production project, Auth redirect allowlist, browser/API origin policy, Content Security Policy, HSTS, trusted-proxy policy, and distributed abuse controls.
5. Insert environment-scoped secrets through the approved secret manager, then perform staged rotation and negative logging checks. Never copy `.env.local` into a deployment.
6. Establish durable metrics, alert destinations, primary/backup responders, privacy-request operators, incident severity policy, and a tested escalation path.
7. Create an immutable release candidate from the exact reviewed commit. Deploy a non-production preview and rerun the complete gate.
8. Request a separate production approval. Deploy application code before enabling any scheduler or optional provider. Run read-only health checks and user-journey smoke checks.
9. Enable one optional integration at a time only after its terms, credential scope, attribution, retention, rate limits, and rollback switch are approved.

## Environment and secret matrix

Presence was checked without printing values. The repository has no GitHub Environments, repository Actions secrets/variables, Vercel metadata, staging URL, production URL, or staging/production project mapping. Local browser Supabase settings are generic and therefore cannot be classified as staging or production.

| Configuration | Classification and purpose | Local presence | Staging | Production | Rotation / owner requirement |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` | public project endpoint | present, environment unknown | unavailable | unavailable | platform owner; project-specific |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | public browser key, still RLS-bound | present, environment unknown | unavailable | unavailable | platform owner; rotate with client deployment |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | server-only privileged DB access | missing | unavailable | unavailable | security + DB owner; emergency revoke path required |
| `INTERNAL_JOB_SIGNING_SECRET` / legacy `INTERNAL_DAILY_PICK_JOB_SECRET` | server-only HMAC for explicit jobs | missing | unavailable | unavailable | operations owner; separate per environment |
| `GEMINI_API_KEY` / legacy `GOOGLE_API_KEY` | optional server-only AI analysis | present | unavailable | unavailable | AI provider owner; disable-on-leak |
| `RAKUTEN_APPLICATION_ID`, `RAKUTEN_ACCESS_KEY` | optional server-only market provider | present | unavailable | unavailable | provider owner; application-scoped |
| `RAKUTEN_REQUEST_ORIGIN` | exact registered Allowed Website origin, not a secret | missing | unavailable | unavailable | provider owner; never guess |
| `RAKUTEN_AFFILIATE_ID` | optional attribution identifier | present | unavailable | unavailable | commerce/legal owner |
| `YAHOO_SHOPPING_APP_ID` | optional server-only provider credential | present | unavailable | unavailable | provider owner |
| `EBAY_PRODUCTION_CLIENT_ID`, `EBAY_PRODUCTION_CLIENT_SECRET` | optional server-only OAuth client | present | unavailable | unavailable | provider owner; secret rotation pair |
| `EBAY_PRODUCTION_MARKETPLACE_ID` | non-secret marketplace scope | present | unavailable | unavailable | provider owner |
| StockX credentials/tokens | optional approved catalog integration | missing | unavailable | unavailable | provider/legal owner; no access today |
| `EXTERNAL_PROVIDERS_DISABLED` | fail-safe integration switch | repository default documents `true` | unverified | unverified | release operator must prove fail-closed state |

`EBAY_PRODUCTION_DEV_ID` may exist in local examples but is not consumed by the current Browse adapter. File-backed market history/targets are local operational inputs, not production secret storage. No credential value, raw provider body, query, user identity, token, authorization header, or signed body was recorded during this review.

## Secret rotation and leak response

Use this sequence independently for each environment and provider:

1. Identify the credential owner, consumers, scopes, creation date, last rotation, and revocation path. If any field is unknown, stop.
2. Put the affected optional provider or internal job in its fail-closed disabled state. Preserve deterministic Core/Ryo behavior and DB-only `/today` reads.
3. Issue a new least-privilege credential in the provider console. Do not revoke the old credential until the non-production deployment is healthy unless active compromise requires immediate revocation.
4. Update only the approved secret manager for staging, deploy the same reviewed artifact, and run presence-only, negative-log, authentication, timeout, rate-limit, and fallback tests.
5. Obtain explicit production approval, update the production secret manager, deploy, and run one bounded read-only smoke where the provider policy permits it.
6. Revoke the old credential, verify failures use safe error codes, and confirm no token or raw request/response entered logs, artifacts, screenshots, Git, or analytics.
7. Record the owner, timestamps, credential fingerprint (never value), affected artifact, test result, and rollback decision.

For a suspected leak: disable the integration, revoke first, search Git history/build artifacts/runtime logs without echoing the secret, rotate related credentials, preserve audit evidence, assess user/provider impact, and follow the approved incident notification policy. The production service-role key and internal-job secret require the highest-severity response because they cross privileged server boundaries.

## Domain, Auth, cookie, CORS, and header review

| Control | Repository evidence | Production result |
| --- | --- | --- |
| Authentication | Supabase SSR uses server-validated `getUser()`; protected page prefixes redirect unauthenticated users | code-ready; production project and redirects unconfigured |
| Authorization | user-owned repositories plus RLS; Data Steward checks are server-side | ephemeral pgTAP PASS; persistent staging not run |
| Cookies | Supabase SSR owns cookie attributes and proxy refresh | inspect `Secure`, `HttpOnly`, `SameSite`, domain, expiry on the chosen HTTPS preview |
| Mutation origin | shared guard rejects cross-host Origin and requires Origin in production | applied to auth, private, admin, market, analysis, and feedback mutations; trusted-proxy behavior still needs hosting validation |
| CORS | no broad application CORS grant is configured | canonical UI/API origin not selected; keep same-origin unless explicitly reviewed |
| Current headers | `nosniff`, frame denial, strict-origin referrer, restrictive permissions, same-origin opener | code-ready baseline |
| CSP | not configured | blocker until scripts, styles, Supabase, images, and optional providers are validated in staging |
| HSTS | not configured | add only after the canonical HTTPS domain and subdomain policy are approved |
| TLS / canonical host | platform responsibility | unavailable |

Do not guess production origins or add a permissive wildcard. Validate Supabase Site URL and redirect URLs, password-reset return URLs, login `next` handling, proxy-forwarded host trust, cookie scope, CSP report-only telemetry, and HSTS rollout on the actual staging hostname before enforcement.

## Rate limiting and abuse controls

The shared mutation guard enforces JSON/content-length/query bounds, bounded body reads, unsafe JSON key/depth/node rejection, same-host Origin, and one-minute in-process IP buckets. Public analysis and feedback mutations now use that guard. Auth routes have tighter limits; internal jobs require HMAC-SHA256, timestamp freshness, job name, idempotency key, and raw-body signature. Market providers use bounded request/response sizes, timeouts, limited retry, cache, single-flight, and circuit breaking.

The in-process bucket is not a production distributed limiter and trusts platform-forwarded client IP metadata. Before production, configure a platform/edge limiter using a trusted proxy chain, route class, account identity where available, and privacy-safe IP handling. Define separate quotas for sign-in/reset, AI/image analysis, market search, feedback, admin mutation, and signed jobs. Prove 429 behavior, retry guidance, horizontal-instance consistency, IPv6 treatment, NAT fairness, and an emergency deny switch. Never log request bodies, provider queries, image bytes, credentials, or authorization headers.

## Monitoring, alerting, and SLO handoff

Current code produces safe provider observations and evaluated data-quality alerts. It caps reads, returns `notificationsSent: false`, and does not configure durable telemetry, email, webhook, pager, or on-call ownership. In-memory provider cache/circuit/observation state must not be treated as durable production monitoring.

Before go-live, approve SLOs and alert routing for:

- application availability, 5xx rate, p50/p95/p99 latency, deployment health, and browser error rate;
- sign-in/reset failures, 401/403/429 spikes, rejected Origins, oversized/unsafe bodies, internal-job signature/replay failures, and admin authorization denials;
- database connection saturation, slow queries, storage growth, migration state, backup freshness, restore test age, RLS/cross-user sentinel failures, and privacy-request backlog;
- provider success/empty/401/403/429/timeout/schema rates, latency, cache/single-flight behavior, and breaker state without raw queries or URLs;
- release conflicts, duplicates, stale evidence, pending review, Style Code/date/region/colorway missingness, invalid preferences, orphan feedback, and snapshot-link errors.

Assign a primary service owner, backup responder, security owner, DB/backup owner, privacy operator, and provider/legal owner. Define severity, acknowledgement and mitigation targets, quiet hours, escalation, maintenance suppression, evidence retention, and a value-free dashboard. Alert delivery must be tested in staging before any production destination is enabled.

## Backup, restore, and rollback

No persistent staging or production backup mechanism was discoverable. Ephemeral CI database success is not a backup or restore proof. The operator must select and record:

- platform backup/PITR capability, encryption, region, retention, access control, restore owner, RPO, and RTO;
- a restore drill into a separate non-production project, including Auth configuration and storage dependencies;
- before/after schema and row-count fingerprints with no private row export into logs;
- restore validation for all seven migrations, pgTAP, user A/B isolation, Data Steward RBAC, orphan/cross-link counters, privacy requests, and the critical UI flow.

Application rollback means redeploying the last known-good immutable artifact and disabling new optional integrations/jobs. Database rollback defaults to an additive forward fix; never edit or reverse an applied migration casually. Migration 005 rewrites legacy source kinds and replaces a constraint, so it requires a verified restore point and explicit staging approval. If schema compatibility prevents application rollback, stop traffic or disable the affected feature and execute the pre-approved recovery decision. A production restore always requires separate authorization.

## Privacy and data lifecycle

Optional AI, search, recommendation-history, behavioral-personalization, analytics, notification, and provider processing default off and are separately consented. Authenticated explicit product actions may be stored. RLS and owner-scoped repositories protect user data; the real ephemeral suite passed its isolation assertions.

Export and deletion endpoints create rate-limited, auditable pending requests; deletion requires `DELETE MY ACCOUNT`. They intentionally do not return archives inline or synchronously destroy data. There is currently no approved asynchronous fulfillment worker, operator runbook, identity re-verification step, export delivery mechanism, deletion cascade proof, retention schedule enforcement job, or staging evidence that post-deletion orphan/cross-link counters remain zero. Production privacy launch is blocked until those are implemented and legally approved.

## Complete release gate

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm test:migrations
pnpm test:rls
pnpm test:security
pnpm test:providers
pnpm web:build
pnpm e2e
pnpm test:a11y
pnpm audit --json
pnpm audit --audit-level=high
git diff --check
```

GitHub must also pass CI, Real Supabase DB Security, CodeQL, dependency review, and secret scan on the exact PR head. No Critical/High dependency issue, failed RLS assertion, cross-user counter above zero, console/hydration error, browser overflow, accessibility regression, unpinned third-party Action, or credential-shaped tracked content is acceptable.

## Stop conditions and initial incident response

Stop or roll back on any migration checksum change for 001–004; schema-history mismatch; Auth redirect/cookie/origin failure; cross-user read/write/linkage above zero; unauthorized Admin access; privacy orphan; provider raw-data/secret logging; marketplace evidence promoted as official; Core/Ryo result change; automatic provider call at login or `/today`; repeated 401/403/429/timeout/schema errors; or any failed required gate.

Initial response: freeze the release, disable the affected optional provider/job, retain value-free request/deployment identifiers, restore the last known-good application artifact when compatible, notify the assigned owner, classify security/privacy impact, and use only the approved additive database fix or separately authorized restore. Do not improvise a production mutation from this document.
