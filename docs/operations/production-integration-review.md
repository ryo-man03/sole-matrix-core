# Production integration review handoff

This runbook starts after the stacked PRs are approved. It does not authorize production changes by itself.

## Required order

1. Merge PR A through PR E in stack order and confirm the resulting migration files are byte-identical to their reviewed versions. Migrations 001–004 must remain immutable.
2. Follow the [staging production rehearsal](staging-production-rehearsal.md). On a fresh staging project apply migrations 001–007 in order; on an existing staging project prove immutable history before applying only unapplied 005–007. Run real PostgreSQL constraint, RLS user A/B, cross-user feedback linkage, and Data Steward allow/deny tests.
3. Assign a Data Steward role to a named test account through the controlled server-side process. Verify anonymous/user denial, authorized reads, staging-only manual drafts, review audit entries, and zero client role bypass.
4. Configure separate non-production internal-job HMAC secrets. Invoke release ingestion and Daily Picks with bounded, signed, idempotent requests. Verify replay behavior before scheduling anything.
5. Configure `RAKUTEN_REQUEST_ORIGIN` to the exact Allowed Websites origin. Run one bounded, read-only Rakuten smoke and retain only the safe status/normalization summary. If 403 remains, keep status `UNAUTHORIZED`.
6. Recheck Yahoo/eBay terms and credentials. Verify eBay tokens remain server memory only, response persistence is zero, and forecast/completed-sale claims remain disabled.
7. Add an automated Release Provider only when the registry records explicit authorization for collection, storage, display, retention, attribution, and rate limits. Until then use the manual/review pipeline.
8. Deploy an application preview, run the complete gate below, inspect provider/data-quality dashboards, then request a separate production approval.

## Complete gate

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

Current code-foundation status is `REAL EPHEMERAL SUPABASE VERIFIED`: the required workflow applied migrations 001–007 and passed 65 pgTAP tests at `main` `245d3f354dbb8c48dbac77dfe98a225ef164d2d3`. This does not substitute for the persistent staging rehearsal in the order above. Local Windows database execution is not required for CI verification, and production remains untouched.

## Stop conditions

- Any migration checksum change for 001–004.
- Cross-user read/write or feedback linkage greater than zero.
- Anonymous/normal-user Admin access or client-side credential exposure.
- A marketplace listing promoted to official release evidence.
- Rakuten remains unauthorized but is presented as live verified.
- Provider raw bodies, tokens, queries, user identity, or listing URLs appear in observations/audit logs.
- Market data changes Core/Ryo results, or login/`/today` triggers an external provider automatically.
- Any Critical/High dependency issue, failed RLS test, browser overflow, console/hydration error, or accessibility regression.

## Rollback expectations

Use deployment rollback and database restore procedures approved by the operator. Do not edit an applied migration in place. Disable the affected internal job/provider through configuration, preserve audit evidence, and re-enter review with an additive corrective migration.
