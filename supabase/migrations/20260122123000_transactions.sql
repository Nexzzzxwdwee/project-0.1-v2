-- Create transactions table (earnings MVP)
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null,
  kind text not null,
  amount numeric not null,
  currency text not null,
  category text not null,
  note text,
  date date not null,
  created_at bigint,
  updated_at bigint
);

alter table public.transactions enable row level security;

drop policy if exists transactions_select_own on public.transactions;
drop policy if exists transactions_insert_own on public.transactions;
drop policy if exists transactions_update_own on public.transactions;
drop policy if exists transactions_delete_own on public.transactions;

create policy transactions_select_own on public.transactions
for select using (auth.uid() = user_id);

create policy transactions_insert_own on public.transactions
for insert with check (auth.uid() = user_id);

create policy transactions_update_own on public.transactions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy transactions_delete_own on public.transactions
for delete using (auth.uid() = user_id);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date);

create index if not exists transactions_user_updated_idx
  on public.transactions (user_id, updated_at);
