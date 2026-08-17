begin;

create type public.staff_role as enum ('data_steward');
create type public.steward_draft_state as enum ('draft', 'validated', 'rejected');
create type public.provider_cache_state as enum ('hit', 'miss', 'stale', 'bypass', 'single_flight_hit', 'unknown');

create table public.staff_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.staff_role not null,
  assigned_by uuid references auth.users(id) on delete set null,
  assignment_reason text not null check (char_length(assignment_reason) between 8 and 500),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= assigned_at)
);
create unique index staff_role_assignments_active_uidx
  on public.staff_role_assignments(user_id, role) where revoked_at is null;

create function public.is_data_steward()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role = 'data_steward'
      and assignment.revoked_at is null
  );
$$;

create table public.manual_release_drafts (
  id uuid primary key default gen_random_uuid(),
  canonical_brand text not null check (char_length(canonical_brand) between 1 and 80),
  canonical_model_name text not null check (char_length(canonical_model_name) between 1 and 160),
  model_family text not null check (char_length(model_family) between 1 and 120),
  generation text check (generation is null or char_length(generation) <= 80),
  colorway_name text check (colorway_name is null or char_length(colorway_name) <= 160),
  style_code text check (style_code is null or char_length(style_code) <= 40),
  release_date date,
  region text not null check (char_length(region) between 2 and 12),
  information_state public.release_information_state not null,
  review_state public.steward_draft_state not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index manual_release_drafts_review_idx on public.manual_release_drafts(review_state, created_at desc);

create table public.manual_evidence_drafts (
  id uuid primary key default gen_random_uuid(),
  source_url text not null check (char_length(source_url) between 8 and 2048 and source_url ~ '^https://'),
  source_kind text not null check (source_kind in ('manual_official_reference', 'manual_retailer_reference', 'manual_other')),
  canonical_brand text not null check (char_length(canonical_brand) between 1 and 80),
  canonical_model_name text not null check (char_length(canonical_model_name) between 1 and 160),
  style_code text check (style_code is null or char_length(style_code) <= 40),
  colorway_name text check (colorway_name is null or char_length(colorway_name) <= 160),
  observed_release_date date,
  region text not null check (char_length(region) between 2 and 12),
  information_state public.release_information_state not null,
  review_state public.steward_draft_state not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index manual_evidence_drafts_review_idx on public.manual_evidence_drafts(review_state, created_at desc);

create table public.provider_observations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  provider_id text not null check (char_length(provider_id) between 1 and 80),
  operation text not null check (char_length(operation) between 1 and 80),
  status text not null check (char_length(status) between 1 and 80),
  duration_ms integer not null check (duration_ms between 0 and 300000),
  retry_count smallint not null default 0 check (retry_count between 0 and 10),
  cache_status public.provider_cache_state not null default 'unknown',
  normalized_count integer not null default 0 check (normalized_count >= 0),
  exact_count integer not null default 0 check (exact_count >= 0),
  probable_count integer not null default 0 check (probable_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  safe_error_code text check (safe_error_code is null or char_length(safe_error_code) <= 120),
  observed_at timestamptz not null default now()
);
create index provider_observations_provider_time_idx on public.provider_observations(provider_id, observed_at desc);
create index provider_observations_status_time_idx on public.provider_observations(status, observed_at desc);

create table public.data_steward_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 200),
  request_id uuid not null,
  before_fingerprint text check (before_fingerprint is null or before_fingerprint ~ '^[a-f0-9]{64}$'),
  after_fingerprint text check (after_fingerprint is null or after_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
create index data_steward_audit_actor_time_idx on public.data_steward_audit_log(actor_id, created_at desc);
create index data_steward_audit_entity_idx on public.data_steward_audit_log(entity_type, entity_id, created_at desc);

create trigger manual_release_drafts_set_updated_at before update on public.manual_release_drafts
  for each row execute function public.set_updated_at();
create trigger manual_evidence_drafts_set_updated_at before update on public.manual_evidence_drafts
  for each row execute function public.set_updated_at();

alter table public.staff_role_assignments enable row level security;
alter table public.manual_release_drafts enable row level security;
alter table public.manual_evidence_drafts enable row level security;
alter table public.provider_observations enable row level security;
alter table public.data_steward_audit_log enable row level security;

revoke all on public.staff_role_assignments, public.manual_release_drafts, public.manual_evidence_drafts,
  public.provider_observations, public.data_steward_audit_log from anon, authenticated;
grant all on public.staff_role_assignments, public.manual_release_drafts, public.manual_evidence_drafts,
  public.provider_observations, public.data_steward_audit_log to service_role;
revoke all on function public.is_data_steward() from public, anon;
grant execute on function public.is_data_steward() to authenticated;

commit;
