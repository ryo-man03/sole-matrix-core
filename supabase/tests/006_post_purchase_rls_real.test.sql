begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

select is(
  (select count(*) from pg_class
    where oid in (
      'public.purchase_reports'::regclass,
      'public.fit_feedback'::regclass,
      'public.fit_preference_profiles'::regclass,
      'public.product_events'::regclass
    ) and relrowsecurity),
  4::bigint,
  'migration 006 tables have RLS enabled'
);

select is(
  (select count(*) from pg_constraint
    where conname in (
      'purchase_reports_snapshot_owner_fkey',
      'purchase_reports_wishlist_owner_fkey',
      'purchase_reports_owned_owner_fkey',
      'fit_feedback_purchase_owner_fkey',
      'fit_feedback_owned_owner_fkey'
    ) and contype = 'f'),
  5::bigint,
  'all composite ownership foreign keys exist'
);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'fit-user-a@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'fit-user-b@example.test');

insert into public.recommendation_snapshots (
  id, user_id, recommendation_id, input_snapshot, result_snapshot, algorithm_version
) values
  ('21000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'rec-a', '{}', '{}', 'test'),
  ('21000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'rec-b', '{}', '{}', 'test');

insert into public.wishlist_items (
  id, user_id, brand, model_name, model_family
) values
  ('22000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Brand A', 'Model A', 'Family A'),
  ('22000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Brand B', 'Model B', 'Family B');

insert into public.owned_sneakers (
  id, user_id, brand, model_name, model_family
) values
  ('23000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Brand A', 'Model A', 'Family A'),
  ('23000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Brand B', 'Model B', 'Family B');

insert into public.purchase_reports (
  id, user_id, idempotency_key, recommendation_snapshot_id, wishlist_item_id,
  owned_sneaker_id, canonical_key, brand, model_name, model_family
) values (
  '24000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000002',
  'purchase-user-b',
  '21000000-0000-4000-8000-000000000002',
  '22000000-0000-4000-8000-000000000002',
  '23000000-0000-4000-8000-000000000002',
  '{}', 'Brand B', 'Model B', 'Family B'
);

insert into public.fit_feedback (
  id, user_id, idempotency_key, purchase_report_id, owned_sneaker_id, overall_fit
) values (
  '25000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000002',
  'fit-user-b-fixture',
  '24000000-0000-4000-8000-000000000002',
  '23000000-0000-4000-8000-000000000002',
  'true_to_size'
);

insert into public.consent_records (user_id, consent_type, granted, policy_version, recorded_at) values
  ('00000000-0000-4000-8000-000000000001', 'analytics', true, 'test-v1', now()),
  ('00000000-0000-4000-8000-000000000002', 'analytics', true, 'test-v1', now());

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

select lives_ok(
  $$insert into public.purchase_reports (
      id, user_id, idempotency_key, recommendation_snapshot_id, wishlist_item_id,
      owned_sneaker_id, canonical_key, brand, model_name, model_family
    ) values (
      '24000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001', 'purchase-user-a',
      '21000000-0000-4000-8000-000000000001',
      '22000000-0000-4000-8000-000000000001',
      '23000000-0000-4000-8000-000000000001',
      '{}', 'Brand A', 'Model A', 'Family A'
    )$$,
  'User A can link a purchase to User A objects'
);

select throws_ok(
  $$insert into public.purchase_reports (
      user_id, idempotency_key, recommendation_snapshot_id, canonical_key,
      brand, model_name, model_family
    ) values (
      '00000000-0000-4000-8000-000000000001', 'cross-user-snapshot',
      '21000000-0000-4000-8000-000000000002', '{}', 'A', 'A', 'A'
    )$$,
  '23503', null,
  'User A cannot link a purchase to User B recommendation snapshot'
);

select throws_ok(
  $$insert into public.purchase_reports (
      user_id, idempotency_key, wishlist_item_id, canonical_key,
      brand, model_name, model_family
    ) values (
      '00000000-0000-4000-8000-000000000001', 'cross-user-wishlist',
      '22000000-0000-4000-8000-000000000002', '{}', 'A', 'A', 'A'
    )$$,
  '23503', null,
  'User A cannot link a purchase to User B wishlist item'
);

select throws_ok(
  $$insert into public.purchase_reports (
      user_id, idempotency_key, owned_sneaker_id, canonical_key,
      brand, model_name, model_family
    ) values (
      '00000000-0000-4000-8000-000000000001', 'cross-user-owned',
      '23000000-0000-4000-8000-000000000002', '{}', 'A', 'A', 'A'
    )$$,
  '23503', null,
  'User A cannot link a purchase to User B owned sneaker'
);

select lives_ok(
  $$insert into public.fit_feedback (
      id, user_id, idempotency_key, purchase_report_id, owned_sneaker_id, overall_fit
    ) values (
      '25000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001', 'fit-user-a-fixture',
      '24000000-0000-4000-8000-000000000001',
      '23000000-0000-4000-8000-000000000001', 'true_to_size'
    )$$,
  'User A can attach fit feedback to User A purchase and owned sneaker'
);

select throws_ok(
  $$insert into public.fit_feedback (
      user_id, idempotency_key, purchase_report_id, owned_sneaker_id, overall_fit
    ) values (
      '00000000-0000-4000-8000-000000000001', 'cross-user-purchase',
      '24000000-0000-4000-8000-000000000002',
      '23000000-0000-4000-8000-000000000001', 'true_to_size'
    )$$,
  '23503', null,
  'User A cannot attach fit feedback to User B purchase'
);

select results_eq(
  $$select count(*) from public.purchase_reports where user_id = '00000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'User A reads zero User B purchase reports'
);

select results_eq(
  $$select count(*) from public.fit_feedback where user_id = '00000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'User A reads zero User B fit feedback rows'
);

select throws_ok(
  $$insert into public.purchase_reports (
      user_id, idempotency_key, canonical_key, brand, model_name, model_family
    ) values (
      '00000000-0000-4000-8000-000000000002', 'rls-user-b-write', '{}', 'B', 'B', 'B'
    )$$,
  '42501', null,
  'User A cannot write a User B purchase report'
);

select lives_ok(
  $$insert into public.product_events (
      user_id, idempotency_key, event_name, event_class
    ) values (
      '00000000-0000-4000-8000-000000000001', 'analytics-on-event',
      'recommendation_viewed', 'behavior_analytics'
    )$$,
  'User A analytics event is permitted while latest consent is granted'
);

reset role;
insert into public.consent_records (user_id, consent_type, granted, policy_version, recorded_at) values
  ('00000000-0000-4000-8000-000000000001', 'analytics', false, 'test-v2', now() + interval '1 minute');
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$insert into public.product_events (
      user_id, idempotency_key, event_name, event_class
    ) values (
      '00000000-0000-4000-8000-000000000001', 'analytics-off-event',
      'market_listing_clicked', 'behavior_analytics'
    )$$,
  '42501', null,
  'User A analytics event is rejected after latest consent is revoked'
);

select lives_ok(
  $$insert into public.product_events (
      user_id, idempotency_key, event_name, event_class
    ) values (
      '00000000-0000-4000-8000-000000000001', 'explicit-action-event',
      'wishlist_added', 'explicit_product_action'
    )$$,
  'explicit User A product action remains distinct from behavior analytics consent'
);

select throws_ok(
  $$insert into public.consent_records (
      user_id, consent_type, granted, policy_version
    ) values (
      '00000000-0000-4000-8000-000000000002', 'analytics', false, 'forged-by-a'
    )$$,
  '42501', null,
  'User A cannot replace User B consent'
);

select results_eq(
  $$select count(*) from public.product_events where user_id = '00000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'User A reads zero User B product events'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.purchase_reports$$,
  '42501', null,
  'anonymous users cannot read purchase reports'
);

select throws_ok(
  $$insert into public.purchase_reports (
      user_id, idempotency_key, canonical_key, brand, model_name, model_family
    ) values (
      '00000000-0000-4000-8000-000000000001', 'anonymous-write', '{}', 'A', 'A', 'A'
    )$$,
  '42501', null,
  'anonymous users cannot write purchase reports'
);

select throws_ok(
  $$select * from public.fit_feedback$$,
  '42501', null,
  'anonymous users cannot read fit feedback'
);

select throws_ok(
  $$insert into public.product_events (
      user_id, idempotency_key, event_name, event_class
    ) values (
      '00000000-0000-4000-8000-000000000001', 'anonymous-event',
      'wishlist_added', 'explicit_product_action'
    )$$,
  '42501', null,
  'anonymous users cannot write product events'
);

reset role;

select is(
  (select count(*) from public.purchase_reports
    where user_id = '00000000-0000-4000-8000-000000000001'
      and recommendation_snapshot_id = '21000000-0000-4000-8000-000000000002'),
  0::bigint,
  'cross-user snapshot linkage count remains zero'
);

select is(
  (select count(*) from public.fit_feedback
    where user_id = '00000000-0000-4000-8000-000000000001'
      and purchase_report_id = '24000000-0000-4000-8000-000000000002'),
  0::bigint,
  'cross-user fit linkage count remains zero'
);

select * from finish();
rollback;
