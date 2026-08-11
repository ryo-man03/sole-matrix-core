# Account persistence

Authentication uses `@supabase/ssr` browser/server clients and the Next.js proxy session-refresh pattern. `getUser()` is the authority for all private routes; cookie contents and request-body user IDs are never trusted. The publishable key is safe for browser use and RLS remains the authorization boundary. Service-role keys are not used by application clients.

Account data uses additive Postgres migrations and per-user RLS. Repository methods accept the session-derived UUID. The filesystem memory adapter is development-only compatibility code; production has no local-write fallback.

Rollback means deploy the previous application, preserve the new tables, and stop new writes. Schema deletion requires a separately reviewed retention/export procedure.
