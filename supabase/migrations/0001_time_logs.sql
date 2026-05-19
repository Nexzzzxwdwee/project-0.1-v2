-- Time Tracker — per-day hourly log
-- One row per (user_id, date). Slots are stored as JSONB keyed by "HH:MM".

create table if not exists public.time_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  interval_minutes smallint not null default 60 check (interval_minutes in (15, 60)),
  slots jsonb not null default '{}'::jsonb,
  wins text not null default '',
  learnt text not null default '',
  tomorrow text not null default '',
  notes text not null default '',
  updated_at bigint not null,
  unique (user_id, date)
);

create index if not exists time_logs_user_date_idx on public.time_logs (user_id, date desc);

alter table public.time_logs enable row level security;

drop policy if exists "time_logs select own" on public.time_logs;
create policy "time_logs select own"
  on public.time_logs for select
  using (auth.uid() = user_id);

drop policy if exists "time_logs insert own" on public.time_logs;
create policy "time_logs insert own"
  on public.time_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "time_logs update own" on public.time_logs;
create policy "time_logs update own"
  on public.time_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "time_logs delete own" on public.time_logs;
create policy "time_logs delete own"
  on public.time_logs for delete
  using (auth.uid() = user_id);
