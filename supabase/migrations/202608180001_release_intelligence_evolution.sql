begin;

alter type public.release_information_state add value if not exists 'conflicting_evidence';

create table public.release_ingestion_runs(
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  access_mode text not null check(access_mode in('manual_import','fixture','authorized_api','authorized_feed')),
  status text not null default 'running' check(status in('running','succeeded','failed','dry_run')),
  dry_run boolean not null default false,
  idempotency_key text not null,
  cursor_before text,
  cursor_after text,
  observed_count integer not null default 0 check(observed_count >= 0),
  accepted_count integer not null default 0 check(accepted_count >= 0),
  rejected_count integer not null default 0 check(rejected_count >= 0),
  conflict_count integer not null default 0 check(conflict_count >= 0),
  safe_error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider_id,idempotency_key)
);

alter table public.release_evidence drop constraint if exists release_evidence_source_kind_check;
update public.release_evidence set source_kind='editorial_authorized' where source_kind='editorial';
update public.release_evidence set source_kind='manual_other' where source_kind='manual';
alter table public.release_evidence add constraint release_evidence_source_kind_check check(source_kind in(
  'brand_official',
  'authorized_retailer',
  'licensed_feed',
  'editorial_authorized',
  'manual_official_reference',
  'manual_retailer_reference',
  'manual_other'
));

alter table public.release_evidence
  add column provider_id text not null default 'legacy_manual',
  add column provider_source_id text,
  add column external_item_id text,
  add column content_fingerprint text,
  add column source_domain text,
  add column source_independence_key text,
  add column canonical_origin_url text,
  add column supports_release_date boolean not null default false,
  add column supports_region boolean not null default false,
  add column observed_release_date date,
  add column observed_state public.release_information_state,
  add column verification_state text not null default 'unverified' check(verification_state in('verified','model_only','unverified')),
  add column review_state text not null default 'pending' check(review_state in('pending','accepted','rejected','superseded')),
  add column release_variant_id uuid references public.release_variants(id) on delete cascade,
  add column supersedes_evidence_id uuid references public.release_evidence(id) on delete set null,
  add column provider_run_id uuid references public.release_ingestion_runs(id) on delete set null,
  add column first_seen_at timestamptz,
  add column last_seen_at timestamptz,
  add column last_verified_at timestamptz,
  add column provenance jsonb not null default '{}'::jsonb check(jsonb_typeof(provenance)='object');

update public.release_evidence
set content_fingerprint=md5(concat_ws('|',provider_id,coalesce(source_url,''),source_title,fetched_at::text)),
    first_seen_at=fetched_at,
    last_seen_at=fetched_at,
    last_verified_at=case when source_quality >= 70 then fetched_at else null end;

alter table public.release_evidence
  alter column content_fingerprint set not null,
  alter column first_seen_at set not null,
  alter column last_seen_at set not null;

create table public.release_evidence_status_history(
  id uuid primary key default gen_random_uuid(),
  release_evidence_id uuid not null references public.release_evidence(id) on delete cascade,
  from_review_state text check(from_review_state is null or from_review_state in('pending','accepted','rejected','superseded')),
  to_review_state text not null check(to_review_state in('pending','accepted','rejected','superseded')),
  reason_code text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.release_conflicts(
  id uuid primary key default gen_random_uuid(),
  release_item_id uuid not null references public.release_items(id) on delete cascade,
  conflict_field text not null check(conflict_field in('release_date','information_state','region','style_code','colorway')),
  observed_values jsonb not null check(jsonb_typeof(observed_values)='array'),
  independent_source_count integer not null check(independent_source_count >= 2),
  status text not null default 'open' check(status in('open','resolved','dismissed')),
  resolution_note text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index release_ingestion_runs_provider_started_idx on public.release_ingestion_runs(provider_id,started_at desc);
create index release_evidence_provider_external_idx on public.release_evidence(provider_id,external_item_id);
create unique index release_evidence_provider_content_uidx on public.release_evidence(provider_id,external_item_id,content_fingerprint) where external_item_id is not null;
create index release_evidence_fingerprint_idx on public.release_evidence(content_fingerprint);
create index release_evidence_independence_idx on public.release_evidence(source_independence_key);
create index release_evidence_variant_idx on public.release_evidence(release_variant_id);
create index release_evidence_history_evidence_idx on public.release_evidence_status_history(release_evidence_id,changed_at desc);
create index release_conflicts_item_idx on public.release_conflicts(release_item_id,status);
create unique index release_conflicts_open_uidx on public.release_conflicts(release_item_id,conflict_field) where status='open';

alter table public.release_ingestion_runs enable row level security;
alter table public.release_evidence_status_history enable row level security;
alter table public.release_conflicts enable row level security;

revoke all on public.release_ingestion_runs,public.release_evidence_status_history,public.release_conflicts from anon,authenticated;
grant all on public.release_ingestion_runs,public.release_evidence_status_history,public.release_conflicts to service_role;

commit;
