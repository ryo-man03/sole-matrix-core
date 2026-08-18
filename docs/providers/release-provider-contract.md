# Release provider contract

`ReleaseProvider` is a server-side boundary with an explicit capability record, a bounded cursor-based `collect` method, and a provider-specific `normalize` method. A provider is disabled unless its state, source kind, access mode, automated-collection permission, persistence permission, image/excerpt rights, interval, terms review date, and terms version are recorded.

The current executable provider is `manual_seed`. It accepts at most 100 records per run, allows only `manual_official_reference`, `manual_retailer_reference`, or `manual_other`, requires HTTPS provenance, rejects known marketplace hosts, normalizes full style codes, and defaults evidence to manual review `pending`. It performs no network request.

The global ingestion route is `POST /api/internal/jobs/ingest-releases`. It is not a browser or user route. Requests must have JSON content, no query string or browser `Origin`, a body no larger than 64 KiB, and these headers:

- `x-sole-matrix-job-timestamp`
- `x-sole-matrix-job-idempotency-key`
- `x-sole-matrix-job-signature`

The lowercase hex signature is `HMAC-SHA256(secret, timestamp + "." + jobName + "." + idempotencyKey + "." + rawBody)`, with job name `release-ingestion`. The timestamp window is five minutes. In-memory replay rejection is backed by the database uniqueness of `(provider_id, idempotency_key)`. Authentication, request-size, and rate checks happen before JSON dispatch. Logs and errors contain safe codes only.

Ingestion supports cursor continuation and dry-run. Provider calls happen only in a global internal job. Login, recommendation, and `/today` perform zero release-provider requests. No production scheduler is configured by this change.
