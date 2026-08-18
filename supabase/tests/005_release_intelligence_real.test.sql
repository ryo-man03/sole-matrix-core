begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

select is(
  (select count(*) from supabase_migrations.schema_migrations),
  7::bigint,
  'all seven repository migrations were applied to the fresh database'
);

select is(
  (select count(*) from supabase_migrations.schema_migrations
    where version in ('202608180001', '202608180002', '202608180003')),
  3::bigint,
  'migrations 005 through 007 are present in migration history'
);

select has_table('public', 'release_ingestion_runs', 'release ingestion runs table exists');
select has_table('public', 'release_evidence_status_history', 'release evidence history table exists');
select has_table('public', 'release_conflicts', 'release conflicts table exists');
select has_column('public', 'release_evidence', 'content_fingerprint', 'release evidence provenance columns exist');

select is(
  (select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typnamespace = 'public'::regnamespace
      and t.typname = 'release_information_state'
      and e.enumlabel = 'conflicting_evidence'),
  1::bigint,
  'conflicting evidence enum state is active'
);

select is(
  (select count(*) from pg_class
    where oid in (
      'public.release_ingestion_runs'::regclass,
      'public.release_evidence_status_history'::regclass,
      'public.release_conflicts'::regclass
    ) and relrowsecurity),
  3::bigint,
  'migration 005 service tables have RLS enabled'
);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'release-user-a@example.test');

insert into public.release_items (
  id, canonical_brand, canonical_model_name, model_family, information_state
) values (
  '10000000-0000-4000-8000-000000000001', 'Test Brand', 'Test Model', 'Test Family', 'official_announced'
);

insert into public.release_evidence (
  id, release_item_id, source_kind, source_title, source_quality,
  content_fingerprint, first_seen_at, last_seen_at
) values (
  '11000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'brand_official', 'Official test evidence', 100,
  'release-evidence-fixture-one', now(), now()
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

select results_eq(
  $$select count(*) from public.release_evidence$$,
  array[1::bigint],
  'authenticated users retain read-only release evidence access'
);

select throws_ok(
  $$insert into public.release_evidence (
      release_item_id, source_kind, source_title, source_quality,
      content_fingerprint, first_seen_at, last_seen_at
    ) values (
      '10000000-0000-4000-8000-000000000001', 'manual_other', 'forbidden', 1,
      'forbidden-authenticated-write', now(), now()
    )$$,
  '42501', null,
  'authenticated users cannot write release evidence'
);

select throws_ok(
  $$select * from public.release_ingestion_runs$$,
  '42501', null,
  'authenticated users cannot read service-only ingestion metadata'
);

reset role;
set local role service_role;

select lives_ok(
  $$insert into public.release_ingestion_runs (
      id, provider_id, access_mode, status, idempotency_key, observed_count, accepted_count
    ) values (
      '12000000-0000-4000-8000-000000000001', 'fixture', 'fixture', 'succeeded',
      'release-run-fixture', 1, 1
    )$$,
  'service role can write bounded ingestion metadata'
);

select throws_ok(
  $$insert into public.release_ingestion_runs (
      provider_id, access_mode, status, idempotency_key, observed_count
    ) values ('fixture', 'fixture', 'failed', 'negative-count-fixture', -1)$$,
  '23514', null,
  'ingestion count constraints are enforced by Postgres'
);

reset role;

select lives_ok(
  $$insert into public.release_evidence (
      id, release_item_id, source_kind, source_title, source_quality,
      content_fingerprint, first_seen_at, last_seen_at, supersedes_evidence_id
    ) values (
      '11000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001',
      'manual_official_reference', 'Superseding evidence', 90,
      'release-evidence-fixture-two', now(), now(),
      '11000000-0000-4000-8000-000000000001'
    )$$,
  'valid evidence supersession is persisted'
);

select throws_ok(
  $$insert into public.release_evidence (
      release_item_id, source_kind, source_title, source_quality,
      content_fingerprint, first_seen_at, last_seen_at, supersedes_evidence_id
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'manual_other', 'Invalid supersession', 10,
      'release-evidence-fixture-invalid', now(), now(),
      'ffffffff-ffff-4fff-8fff-ffffffffffff'
    )$$,
  '23503', null,
  'invalid superseded evidence IDs are rejected by the foreign key'
);

select lives_ok(
  $$insert into public.release_conflicts (
      id, release_item_id, conflict_field, observed_values, independent_source_count
    ) values (
      '13000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'release_date', '["2026-09-01", "2026-09-02"]'::jsonb, 2
    )$$,
  'release conflicts persist with valid independent evidence counts'
);

select throws_ok(
  $$insert into public.release_conflicts (
      release_item_id, conflict_field, observed_values, independent_source_count
    ) values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'region', '["JP", "US"]'::jsonb, 2
    )$$,
  '23503', null,
  'release conflict foreign keys reject unknown release items'
);

set local role anon;
select throws_ok(
  $$select * from public.release_evidence$$,
  '42501', null,
  'anonymous users cannot read release evidence'
);
reset role;

select is(
  (select count(*) from public.release_conflicts where status = 'open'),
  1::bigint,
  'the valid open conflict state is stored without being hidden'
);

select * from finish();
rollback;
