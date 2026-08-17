begin;

create type public.product_event_name as enum (
  'recommendation_viewed',
  'recommendation_feedback_submitted',
  'market_search_requested',
  'market_listing_clicked',
  'wishlist_added',
  'wishlist_removed',
  'purchase_reported',
  'owned_sneaker_added',
  'fit_feedback_submitted',
  'purchase_satisfaction_submitted'
);
create type public.product_event_class as enum ('explicit_product_action', 'behavior_analytics');
create type public.overall_fit as enum ('too_small', 'slightly_small', 'true_to_size', 'slightly_large', 'too_large');
create type public.toe_room as enum ('tight', 'good', 'roomy');
create type public.width_feel as enum ('tight', 'slightly_tight', 'comfortable', 'slightly_roomy', 'roomy');
create type public.heel_hold as enum ('slipping', 'secure', 'tight');
create type public.instep_feel as enum ('tight', 'comfortable', 'roomy');

alter table public.owned_sneakers
  add constraint owned_sneakers_id_user_id_key unique (id, user_id);
alter table public.wishlist_items
  add constraint wishlist_items_id_user_id_key unique (id, user_id);

create table public.purchase_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 128),
  recommendation_snapshot_id uuid,
  wishlist_item_id uuid,
  owned_sneaker_id uuid,
  canonical_key jsonb not null check (jsonb_typeof(canonical_key) = 'object'),
  brand text not null check (char_length(brand) between 1 and 80),
  model_name text not null check (char_length(model_name) between 1 and 160),
  model_family text not null check (char_length(model_family) between 1 and 120),
  generation text check (generation is null or char_length(generation) <= 80),
  colorway_name text check (colorway_name is null or char_length(colorway_name) <= 160),
  style_code text check (style_code is null or char_length(style_code) <= 40),
  audience public.sneaker_audience not null default 'unknown',
  purchased_size_system public.size_system,
  purchased_size_value numeric(5,2) check (purchased_size_value is null or (purchased_size_value > 0 and purchased_size_value < 100)),
  purchased_condition text not null default 'unknown' check (purchased_condition in ('new', 'used', 'unknown')),
  purchased_at date,
  satisfaction_rating smallint check (satisfaction_rating is null or satisfaction_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_reports_user_idempotency_key unique (user_id, idempotency_key),
  constraint purchase_reports_id_user_id_key unique (id, user_id),
  constraint purchase_reports_snapshot_owner_fkey foreign key (recommendation_snapshot_id, user_id)
    references public.recommendation_snapshots(id, user_id) on delete set null (recommendation_snapshot_id),
  constraint purchase_reports_wishlist_owner_fkey foreign key (wishlist_item_id, user_id)
    references public.wishlist_items(id, user_id) on delete set null (wishlist_item_id),
  constraint purchase_reports_owned_owner_fkey foreign key (owned_sneaker_id, user_id)
    references public.owned_sneakers(id, user_id) on delete set null (owned_sneaker_id)
);
create index purchase_reports_user_created_idx on public.purchase_reports(user_id, created_at desc);

create table public.fit_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 128),
  purchase_report_id uuid not null,
  owned_sneaker_id uuid not null,
  size_system public.size_system,
  size_value numeric(5,2) check (size_value is null or (size_value > 0 and size_value < 100)),
  overall_fit public.overall_fit,
  toe_room public.toe_room,
  width_feel public.width_feel,
  heel_hold public.heel_hold,
  instep_feel public.instep_feel,
  same_size_again boolean,
  note text check (note is null or char_length(note) <= 500),
  preference_profile_update_applied boolean not null default false,
  created_at timestamptz not null default now(),
  constraint fit_feedback_user_idempotency_key unique (user_id, idempotency_key),
  constraint fit_feedback_id_user_id_key unique (id, user_id),
  constraint fit_feedback_purchase_owner_fkey foreign key (purchase_report_id, user_id)
    references public.purchase_reports(id, user_id) on delete cascade,
  constraint fit_feedback_owned_owner_fkey foreign key (owned_sneaker_id, user_id)
    references public.owned_sneakers(id, user_id) on delete cascade,
  check (
    size_value is not null or overall_fit is not null or toe_room is not null or width_feel is not null
    or heel_hold is not null or instep_feel is not null or same_size_again is not null or note is not null
  )
);
create index fit_feedback_user_created_idx on public.fit_feedback(user_id, created_at desc);
create index fit_feedback_owned_idx on public.fit_feedback(user_id, owned_sneaker_id, created_at desc);

create table public.fit_preference_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_version text not null default 'fit-preference-v1',
  feedback_count integer not null default 0 check (feedback_count >= 0),
  true_to_size_count integer not null default 0 check (true_to_size_count >= 0),
  small_count integer not null default 0 check (small_count >= 0),
  large_count integer not null default 0 check (large_count >= 0),
  width_tight_count integer not null default 0 check (width_tight_count >= 0),
  width_roomy_count integer not null default 0 check (width_roomy_count >= 0),
  same_size_again_yes_count integer not null default 0 check (same_size_again_yes_count >= 0),
  same_size_again_no_count integer not null default 0 check (same_size_again_no_count >= 0),
  updated_at timestamptz not null default now()
);

create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 128),
  event_name public.product_event_name not null,
  event_class public.product_event_class not null,
  subject_type text check (subject_type is null or char_length(subject_type) <= 80),
  subject_id text check (subject_id is null or char_length(subject_id) <= 200),
  properties jsonb not null default '{}' check (jsonb_typeof(properties) = 'object' and octet_length(properties::text) <= 4096),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint product_events_user_idempotency_key unique (user_id, idempotency_key),
  check (
    (event_class = 'behavior_analytics' and event_name in ('recommendation_viewed', 'market_listing_clicked'))
    or
    (event_class = 'explicit_product_action' and event_name not in ('recommendation_viewed', 'market_listing_clicked'))
  )
);
create index product_events_user_occurred_idx on public.product_events(user_id, occurred_at desc);

create trigger purchase_reports_set_updated_at before update on public.purchase_reports
  for each row execute function public.set_updated_at();
create trigger fit_preference_profiles_set_updated_at before update on public.fit_preference_profiles
  for each row execute function public.set_updated_at();

alter table public.purchase_reports enable row level security;
alter table public.fit_feedback enable row level security;
alter table public.fit_preference_profiles enable row level security;
alter table public.product_events enable row level security;

create policy purchase_reports_own on public.purchase_reports for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy fit_feedback_own on public.fit_feedback for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy fit_preference_profiles_own on public.fit_preference_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy product_events_select_own on public.product_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy product_events_insert_own_with_consent on public.product_events for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      event_class = 'explicit_product_action'
      or exists (
        select 1 from public.consent_records consent
        where consent.user_id = (select auth.uid())
          and consent.consent_type = 'analytics'
          and consent.granted = true
          and not exists (
            select 1 from public.consent_records newer
            where newer.user_id = consent.user_id
              and newer.consent_type = consent.consent_type
              and (newer.recorded_at, newer.id) > (consent.recorded_at, consent.id)
          )
      )
    )
  );

revoke all on public.purchase_reports, public.fit_feedback, public.fit_preference_profiles, public.product_events from anon;
grant select, insert, update, delete on public.purchase_reports, public.fit_feedback, public.fit_preference_profiles to authenticated;
grant select, insert on public.product_events to authenticated;

commit;
