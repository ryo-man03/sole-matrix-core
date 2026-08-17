# Data Steward administration

Data Steward is a server-authorized data-quality surface. It does not edit Core Score, Ryo Score, recommendation rank, paid placement, or provider credentials.

## Routes

- `/admin/providers`: safe provider observations and release-ingestion runs
- `/admin/releases`: read-only Release Catalog and staging-only manual release drafts
- `/admin/evidence`: evidence inventory, bounded review transitions, and staging-only manual evidence drafts
- `/admin/conflicts`: open conflict resolution/dismissal with a required note
- `/admin/data-quality`: Observation → Metric → Threshold → State output and the audit log
- `/admin/import`: CSV preview and validation only

Every page and mutation route calls the server-side `is_data_steward()` database function after `getUser()` verifies the session. There is no client flag, public environment variable, local storage value, or request-body role. Failure to read the role is a denial, not a fallback allowance.

The backing tables have RLS enabled and no `authenticated` table grants. Only the server-held service role can read or write them. The role function has no arguments, reads `auth.uid()`, uses a fixed empty `search_path`, and returns only a boolean.

## Role bootstrap and revocation

No role assignment is seeded or applied by this change. An approved operator must assign the first Data Steward through the controlled database administration path, never from a browser or application API. The intended statement shape is:

```sql
insert into public.staff_role_assignments(user_id, role, assigned_by, assignment_reason)
values ('<approved-auth-user-uuid>', 'data_steward', null, '<controlled bootstrap ticket and approval reason>');
```

Revocation sets `revoked_at`; authorization requires an active row. Assignment/revocation must be added to the organization's change-management and audit procedure before production rollout.

## Manual data boundary

Manual release and evidence entry writes only `manual_*_drafts`. It never promotes rows into `release_items`, `release_variants`, or `release_evidence`. Promotion is intentionally outside this PR and requires a separately approved reviewed workflow.

Evidence review changes only `review_state` and adds evidence-status history. Conflict review changes only an open conflict to `resolved` or `dismissed`, requires a bounded note, and never edits recommendation scores.

Each implemented mutation records actor ID, action, entity, request ID, and before/after SHA-256 fingerprints. Audit rows contain no raw token, OAuth token, credential bundle, provider secret, password, or raw provider response.

## CSV contract

CSV import is preview-only: maximum 256 KiB and 500 non-empty data rows. It rejects unexpected or duplicate columns, column-count mismatches, formula prefixes (`=`, `+`, `-`, `@`), non-public/non-HTTPS URLs, impossible dates, invalid enums, duplicates, missing fields, and unclosed quoted fields. The response always reports `productionWritePerformed: false`.
