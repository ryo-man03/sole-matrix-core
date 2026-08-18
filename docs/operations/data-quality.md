# Data quality and observability

Quality is expressed as `Observation → Metric → Threshold → State`, not as an unexplained red/green badge. States are `healthy`, `degraded`, `blocked`, and `unknown`; each metric returns its observation numerator/denominator, sample size, threshold direction, threshold values, and a reason.

## Provider observations

The market search boundary records a random request ID and one safe observation per provider: provider ID, operation, status, duration, retry count, cache state, normalized/exact/probable/rejected counts, safe error code, and timestamp. It never stores query text, user ID, provider response, listing URL, token, credential, or secret.

The 24-hour provider quality window evaluates:

- request count, success and empty rates
- 401, 403, 429, timeout, and schema-error rates
- median latency and p95 only with at least 20 samples
- normalized count and exact/probable/rejected rates
- cache and single-flight hit rates only when cache state was observable

No observations or insufficient samples return `unknown`. Any 401 degrades provider authentication; schema and rate-limit thresholds distinguish degraded from blocked.

## Release quality

The capped operational sample evaluates Style Code, release date, region, and colorway missing rates; open conflict and duplicate-candidate rates; stale evidence; pending manual review; and official/authorized source rate. Conflict spikes, duplicate spikes, stale evidence, and review backlogs return explicit reasons.

## User-data quality

Only aggregate counts leave the service repository. The Data Steward UI never receives user rows. Metrics cover owned identity match, unknown size systems, fit-feedback completion, orphan feedback, invalid preferences, and recommendation-snapshot link errors. Any orphan or invalid cross-link observation is `blocked`.

## Alert contract

Degraded/blocked metrics produce evaluated alert objects with code, state, and reason. This change sends no email, webhook, notification, or pager event and returns `notificationsSent: false`.

Provider observations are limited to 24 hours; domain reads are capped at 10,000 rows and disclose that sampling window. Production-scale exact aggregation should move to reviewed database aggregates if data volume exceeds that boundary.
