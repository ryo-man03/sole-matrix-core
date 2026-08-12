# User data model

User-owned tables use the immutable `auth.users.id` UUID and RLS. Email is never an ownership key. Structured tables cover profiles, explicit preferences, sizes, owned sneakers, wishlist, recommendation snapshots/feedback, consent, privacy requests, daily batches/picks/feedback, and notification settings. Release catalog tables are authenticated-read-only; normal users have no write grant.

Indexes support user/time history, release date/state, one primary size, one pending privacy request, and deterministic batch uniqueness. `updated_at` triggers use a security-invoker function with an empty search path.
