begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select has_function('public', 'is_data_steward', array[]::text[], 'data steward predicate exists');

select ok(
  (select prosecdef from pg_proc where oid = 'public.is_data_steward()'::regprocedure),
  'data steward predicate is SECURITY DEFINER'
);

select is(
  (select pronargs::integer from pg_proc where oid = 'public.is_data_steward()'::regprocedure),
  0,
  'data steward predicate accepts no caller-selected user ID'
);

select ok(
  (select owner.rolname in ('postgres', 'supabase_admin')
    from pg_proc p join pg_roles owner on owner.oid = p.proowner
    where p.oid = 'public.is_data_steward()'::regprocedure),
  'SECURITY DEFINER owner is a controlled Supabase database owner'
);

select ok(
  (select
    position('search_path=' in array_to_string(coalesce(proconfig, array[]::text[]), ',')) > 0
    and array_to_string(coalesce(proconfig, array[]::text[]), ',') not ilike '%public%'
    and array_to_string(coalesce(proconfig, array[]::text[]), ',') not ilike '%pg_temp%'
   from pg_proc where oid = 'public.is_data_steward()'::regprocedure),
  'SECURITY DEFINER uses the narrower empty fixed search_path'
);

select ok(
  (select pg_get_functiondef('public.is_data_steward()'::regprocedure) like '%public.staff_role_assignments%'
    and pg_get_functiondef('public.is_data_steward()'::regprocedure) like '%auth.uid()%'
    and pg_get_functiondef('public.is_data_steward()'::regprocedure) not ilike '%execute%'),
  'SECURITY DEFINER fully qualifies objects and uses no dynamic SQL'
);

select is(
  (select count(*) from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where p.oid = 'public.is_data_steward()'::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'),
  0::bigint,
  'PUBLIC execute is revoked from the SECURITY DEFINER function'
);

select ok(
  not has_function_privilege('anon', 'public.is_data_steward()', 'EXECUTE'),
  'anonymous role cannot execute the data steward predicate'
);

select ok(
  has_function_privilege('authenticated', 'public.is_data_steward()', 'EXECUTE'),
  'authenticated sessions may evaluate only their own data steward status'
);

select is(
  (select count(*) from pg_class
    where oid in (
      'public.staff_role_assignments'::regclass,
      'public.manual_release_drafts'::regclass,
      'public.manual_evidence_drafts'::regclass,
      'public.provider_observations'::regclass,
      'public.data_steward_audit_log'::regclass
    ) and relrowsecurity),
  5::bigint,
  'all migration 007 administration tables have RLS enabled'
);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'normal-user@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'private-user@example.test'),
  ('00000000-0000-4000-8000-000000000003', 'data-steward@example.test');

insert into public.profiles (user_id, display_name) values
  ('00000000-0000-4000-8000-000000000001', 'Normal User'),
  ('00000000-0000-4000-8000-000000000002', 'Private User'),
  ('00000000-0000-4000-8000-000000000003', 'Data Steward');

set local role service_role;
insert into public.staff_role_assignments (
  id, user_id, role, assigned_by, assignment_reason
) values (
  '31000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000003',
  'data_steward', null, 'approved integration test assignment'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

select is(public.is_data_steward(), false, 'normal authenticated user is not a data steward');

select throws_ok(
  $$insert into public.staff_role_assignments (
      user_id, role, assigned_by, assignment_reason
    ) values (
      '00000000-0000-4000-8000-000000000001', 'data_steward',
      '00000000-0000-4000-8000-000000000001', 'self assigned forbidden role'
    )$$,
  '42501', null,
  'normal user cannot insert their own administrator role'
);

select throws_ok(
  $$update public.staff_role_assignments set revoked_at = null$$,
  '42501', null,
  'normal user cannot update administrator assignments'
);

select throws_ok(
  $$select * from public.provider_observations$$,
  '42501', null,
  'normal user cannot read service-only provider observations'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';

select is(public.is_data_steward(), true, 'assigned authenticated user is recognized as a data steward');

select results_eq(
  $$select count(*) from public.profiles where user_id = '00000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'data steward status does not bypass unrelated private user RLS'
);

select throws_ok(
  $$insert into public.manual_release_drafts (
      canonical_brand, canonical_model_name, model_family, region, information_state, created_by
    ) values (
      'Brand', 'Model', 'Family', 'JP', 'official_announced',
      '00000000-0000-4000-8000-000000000003'
    )$$,
  '42501', null,
  'data steward browser session cannot directly write service-only staging tables'
);

reset role;
set local role anon;
select throws_ok(
  $$select public.is_data_steward()$$,
  '42501', null,
  'anonymous sessions cannot execute the privileged predicate'
);
reset role;

set local role service_role;

select lives_ok(
  $$insert into public.provider_observations (
      request_id, provider_id, operation, status, duration_ms
    ) values (
      '32000000-0000-4000-8000-000000000001', 'fixture', 'market_search', 'success', 1
    )$$,
  'service role can record secret-free provider observations'
);

select lives_ok(
  $$insert into public.manual_release_drafts (
      id, canonical_brand, canonical_model_name, model_family, region,
      information_state, created_by
    ) values (
      '33000000-0000-4000-8000-000000000001',
      'Brand', 'Model', 'Family', 'JP', 'official_announced',
      '00000000-0000-4000-8000-000000000003'
    )$$,
  'service role can perform server-authorized manual release staging'
);

select lives_ok(
  $$insert into public.manual_evidence_drafts (
      id, source_url, source_kind, canonical_brand, canonical_model_name,
      region, information_state, created_by
    ) values (
      '34000000-0000-4000-8000-000000000001',
      'https://example.test/evidence', 'manual_official_reference',
      'Brand', 'Model', 'JP', 'official_announced',
      '00000000-0000-4000-8000-000000000003'
    )$$,
  'service role can perform server-authorized manual evidence staging'
);

select lives_ok(
  $$insert into public.data_steward_audit_log (
      actor_id, action, entity_type, entity_id, request_id
    ) values (
      '00000000-0000-4000-8000-000000000003',
      'fixture_created', 'manual_release_draft',
      '33000000-0000-4000-8000-000000000001',
      '35000000-0000-4000-8000-000000000001'
    )$$,
  'service role can append a bounded audit record'
);

reset role;

select is(
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'provider_observations'
      and column_name ~ '(secret|token|credential|authorization|access_key|password)'),
  0::bigint,
  'provider observation schema has no secret-bearing columns'
);

select is(
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'data_steward_audit_log'
      and column_name ~ '(secret|token|credential|authorization|access_key|password)'),
  0::bigint,
  'data steward audit schema has no secret-bearing columns'
);

select * from finish();
rollback;
