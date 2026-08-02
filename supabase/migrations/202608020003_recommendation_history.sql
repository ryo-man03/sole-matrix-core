begin;
create type public.recommendation_sentiment as enum ('liked','disliked','saved','hidden','purchased');
create table public.recommendation_snapshots(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,recommendation_id text not null,
 input_snapshot jsonb not null check(jsonb_typeof(input_snapshot)='object'),result_snapshot jsonb not null check(jsonb_typeof(result_snapshot)='object'),
 algorithm_version text not null,created_at timestamptz not null default now(),unique(user_id,recommendation_id)
);
create index recommendation_snapshots_user_created_idx on public.recommendation_snapshots(user_id,created_at desc);
create table public.recommendation_feedback(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,recommendation_snapshot_id uuid not null references public.recommendation_snapshots(id) on delete cascade,
 canonical_key jsonb not null check(jsonb_typeof(canonical_key)='object'),sentiment public.recommendation_sentiment not null,reason_codes text[] not null default '{}',comment text check(char_length(comment)<=500),created_at timestamptz not null default now()
);
create index recommendation_feedback_user_created_idx on public.recommendation_feedback(user_id,created_at desc);
alter table public.recommendation_snapshots enable row level security;alter table public.recommendation_feedback enable row level security;
create policy recommendation_snapshots_own on public.recommendation_snapshots for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy recommendation_feedback_own on public.recommendation_feedback for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
revoke all on public.recommendation_snapshots,public.recommendation_feedback from anon;
grant select,insert on public.recommendation_snapshots,public.recommendation_feedback to authenticated;
commit;
