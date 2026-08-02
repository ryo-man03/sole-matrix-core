begin;

create type public.experience_level as enum ('beginner','intermediate','power');
create type public.consent_type as enum ('ai_processing','search_grounding','recommendation_history','behavior_personalization','analytics','notifications','external_provider_lookup');
create type public.privacy_request_type as enum ('export','delete');
create type public.privacy_request_status as enum ('pending','processing','completed','rejected');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80 and display_name !~ '[<>[:cntrl:]]'),
  locale text not null default 'ja-JP' check (locale in ('ja-JP','en-US')),
  timezone text not null default 'Asia/Tokyo' check (char_length(timezone) between 1 and 80),
  experience_level public.experience_level not null default 'beginner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type public.consent_type not null,
  granted boolean not null default false,
  policy_version text not null,
  recorded_at timestamptz not null default now()
);
create index consent_records_user_type_recorded_idx on public.consent_records(user_id, consent_type, recorded_at desc);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type public.privacy_request_type not null,
  status public.privacy_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index privacy_requests_one_pending_idx on public.privacy_requests(user_id, request_type) where status = 'pending';

create function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.consent_records enable row level security;
alter table public.privacy_requests enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy consent_records_select_own on public.consent_records for select to authenticated using ((select auth.uid()) = user_id);
create policy consent_records_insert_own on public.consent_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy privacy_requests_select_own on public.privacy_requests for select to authenticated using ((select auth.uid()) = user_id);
create policy privacy_requests_insert_own on public.privacy_requests for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on public.profiles, public.consent_records, public.privacy_requests from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.consent_records, public.privacy_requests to authenticated;

commit;
