begin;
create type public.size_system as enum ('JP','US_M','US_W','UK','EU','UNKNOWN');
create type public.sneaker_audience as enum ('men','women','unisex','kids','unknown');
create type public.condition_preference as enum ('new','used','either');
create type public.wear_frequency as enum ('rarely','monthly','weekly','daily');

create table public.user_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 favorite_brands text[] not null default '{}', avoided_brands text[] not null default '{}', favorite_colors text[] not null default '{}', avoided_colors text[] not null default '{}',
 favorite_materials text[] not null default '{}', avoided_materials text[] not null default '{}', silhouettes text[] not null default '{}', use_cases text[] not null default '{}', style_tags text[] not null default '{}',
 budget_min_jpy integer check (budget_min_jpy is null or budget_min_jpy >= 0), budget_max_jpy integer check (budget_max_jpy is null or budget_max_jpy >= 0),
 budget_is_hard_limit boolean not null default false, condition_preference public.condition_preference not null default 'either',
 inferred_preferences jsonb not null default '{}' check (jsonb_typeof(inferred_preferences) = 'object'), inference_version text, updated_at timestamptz not null default now(),
 check (budget_min_jpy is null or budget_max_jpy is null or budget_min_jpy <= budget_max_jpy)
);
create table public.user_sizes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 size_system public.size_system not null, size_value numeric(5,2) not null check (size_value > 0 and size_value < 100), audience public.sneaker_audience not null,
 primary_size boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index user_sizes_one_primary_idx on public.user_sizes(user_id) where primary_size;
create table public.owned_sneakers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 brand text not null check (char_length(brand) between 1 and 80), model_name text not null check (char_length(model_name) between 1 and 160), model_family text not null check (char_length(model_family) between 1 and 120),
 generation text, colorway_name text, style_code text, audience public.sneaker_audience not null default 'unknown', size_system public.size_system, size_value numeric(5,2),
 user_rating smallint check (user_rating between 1 and 5), wear_frequency public.wear_frequency, notes text check (char_length(notes) <= 1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index owned_sneakers_user_idx on public.owned_sneakers(user_id, created_at desc);
create table public.wishlist_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 brand text not null check (char_length(brand) between 1 and 80), model_name text not null check (char_length(model_name) between 1 and 160), model_family text not null check (char_length(model_family) between 1 and 120),
 generation text, colorway_name text, style_code text, audience public.sneaker_audience not null default 'unknown', desired_size_system public.size_system, desired_size_value numeric(5,2),
 budget_max_jpy integer check (budget_max_jpy is null or budget_max_jpy >= 0), priority smallint not null default 3 check (priority between 1 and 5), notes text check (char_length(notes) <= 1000),
 verification_state text not null default 'unverified' check (verification_state in ('verified','model_only','unverified')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index wishlist_items_user_idx on public.wishlist_items(user_id, priority, created_at desc);
create table public.notification_settings (
 user_id uuid primary key references auth.users(id) on delete cascade, enabled boolean not null default false,
 frequency text not null default 'daily' check (frequency in ('daily','weekly','off')), quiet_hours_start time, quiet_hours_end time,
 timezone text not null default 'Asia/Tokyo', rumor_allowed boolean not null default false, updated_at timestamptz not null default now()
);

create trigger user_preferences_set_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();
create trigger user_sizes_set_updated_at before update on public.user_sizes for each row execute function public.set_updated_at();
create trigger owned_sneakers_set_updated_at before update on public.owned_sneakers for each row execute function public.set_updated_at();
create trigger wishlist_items_set_updated_at before update on public.wishlist_items for each row execute function public.set_updated_at();
create trigger notification_settings_set_updated_at before update on public.notification_settings for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security; alter table public.user_sizes enable row level security; alter table public.owned_sneakers enable row level security; alter table public.wishlist_items enable row level security; alter table public.notification_settings enable row level security;
create policy user_preferences_own on public.user_preferences for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy user_sizes_own on public.user_sizes for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy owned_sneakers_own on public.owned_sneakers for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy wishlist_items_own on public.wishlist_items for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy notification_settings_own on public.notification_settings for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.user_preferences, public.user_sizes, public.owned_sneakers, public.wishlist_items, public.notification_settings from anon;
grant select,insert,update,delete on public.user_preferences, public.user_sizes, public.owned_sneakers, public.wishlist_items, public.notification_settings to authenticated;
commit;
