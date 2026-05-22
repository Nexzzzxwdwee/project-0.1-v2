-- ============================================================================
-- Operators: launch hardening — RLS performance + FK indexes + focus PR RPC
-- Idempotent — safe to re-run.
--
-- Addresses Supabase advisor findings (May 2026), all PERFORMANCE-level (no
-- correctness/exposure issues — every table already has RLS):
--   • auth_rls_initplan (62 policies): wrap auth.uid() in (select auth.uid())
--     so it is evaluated once per query (InitPlan) instead of once per row.
--   • multiple_permissive_policies (70): collapse the overlapping
--     "admin read all" + "own row" policies into a single OR'd policy per
--     table/action so only one policy is evaluated.
--   • unindexed_foreign_keys (5): add covering indexes.
-- Plus: a DB-side aggregate RPC for the focus "Personal Best" (replaces a
-- 10-year client-side scan) and removal of the handle_new_user() RPC exposure.
--
-- Semantics are preserved exactly. Permissive policies are OR'd by Postgres, so
-- merging "is_admin()" with "auth.uid() = user_id" into one USING clause is
-- equivalent to the two separate permissive policies it replaces.
--
-- NOTE on is_admin(): intentionally NOT revoked. It is called *inside* these
-- RLS policies, so authenticated/anon MUST retain EXECUTE or every policy that
-- references it would raise "permission denied for function is_admin". It only
-- ever returns the *calling* user's own admin status, so the RPC surface leaks
-- nothing. The advisor warning for it is acceptable for this design.
-- ============================================================================


-- ── 1. Own-row-only tables: wrap auth.uid() (auth_rls_initplan) ──────────────
-- These tables have no admin-read-all overlap, so only the auth.uid() wrapping
-- changes; policy names and roles are preserved.

-- dca_budget
drop policy if exists "Users can select own budget" on public.dca_budget;
create policy "Users can select own budget" on public.dca_budget
  for select to public using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own budget" on public.dca_budget;
create policy "Users can insert own budget" on public.dca_budget
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own budget" on public.dca_budget;
create policy "Users can update own budget" on public.dca_budget
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- dca_plan_entries
drop policy if exists "Users can select own entries" on public.dca_plan_entries;
create policy "Users can select own entries" on public.dca_plan_entries
  for select to public using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own entries" on public.dca_plan_entries;
create policy "Users can insert own entries" on public.dca_plan_entries
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own entries" on public.dca_plan_entries;
create policy "Users can delete own entries" on public.dca_plan_entries
  for delete to public using ((select auth.uid()) = user_id);

-- trades
drop policy if exists "Users can select own trades" on public.trades;
create policy "Users can select own trades" on public.trades
  for select to public using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own trades" on public.trades;
create policy "Users can insert own trades" on public.trades
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own trades" on public.trades;
create policy "Users can update own trades" on public.trades
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own trades" on public.trades;
create policy "Users can delete own trades" on public.trades
  for delete to public using ((select auth.uid()) = user_id);

-- trading_accounts
drop policy if exists "Users can select own accounts" on public.trading_accounts;
create policy "Users can select own accounts" on public.trading_accounts
  for select to public using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own accounts" on public.trading_accounts;
create policy "Users can insert own accounts" on public.trading_accounts
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own accounts" on public.trading_accounts;
create policy "Users can update own accounts" on public.trading_accounts
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own accounts" on public.trading_accounts;
create policy "Users can delete own accounts" on public.trading_accounts
  for delete to public using ((select auth.uid()) = user_id);

-- transactions
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select to public using ((select auth.uid()) = user_id);
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete to public using ((select auth.uid()) = user_id);

-- user_settings
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
  for select to public using ((select auth.uid()) = user_id);
drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own" on public.user_settings
  for delete to public using ((select auth.uid()) = user_id);


-- ── 2. Admin-read-all + own tables: wrap auth.uid() AND merge SELECT ─────────
-- For each table: insert/update/delete own policies get auth.uid() wrapped; the
-- "admin read all" + "*_select_own" pair is collapsed into one merged SELECT.

-- day_plans
drop policy if exists "day_plans_insert_own" on public.day_plans;
create policy "day_plans_insert_own" on public.day_plans
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "day_plans_update_own" on public.day_plans;
create policy "day_plans_update_own" on public.day_plans
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "day_plans_delete_own" on public.day_plans;
create policy "day_plans_delete_own" on public.day_plans
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "day_plans_select" on public.day_plans;
drop policy if exists "admin read all" on public.day_plans;
drop policy if exists "day_plans_select_own" on public.day_plans;
create policy "day_plans_select" on public.day_plans
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- day_summaries
drop policy if exists "day_summaries_insert_own" on public.day_summaries;
create policy "day_summaries_insert_own" on public.day_summaries
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "day_summaries_update_own" on public.day_summaries;
create policy "day_summaries_update_own" on public.day_summaries
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "day_summaries_delete_own" on public.day_summaries;
create policy "day_summaries_delete_own" on public.day_summaries
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "day_summaries_select" on public.day_summaries;
drop policy if exists "admin read all" on public.day_summaries;
drop policy if exists "day_summaries_select_own" on public.day_summaries;
create policy "day_summaries_select" on public.day_summaries
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- focus_sessions
drop policy if exists "Users can insert own focus sessions" on public.focus_sessions;
create policy "Users can insert own focus sessions" on public.focus_sessions
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own focus sessions" on public.focus_sessions;
create policy "Users can update own focus sessions" on public.focus_sessions
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own focus sessions" on public.focus_sessions;
create policy "Users can delete own focus sessions" on public.focus_sessions
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "focus_sessions_select" on public.focus_sessions;
drop policy if exists "admin read all" on public.focus_sessions;
drop policy if exists "Users can read own focus sessions" on public.focus_sessions;
create policy "focus_sessions_select" on public.focus_sessions
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- goals
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "goals_select" on public.goals;
drop policy if exists "admin read all" on public.goals;
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select" on public.goals
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- journal_active_entry
drop policy if exists "journal_active_entry_insert_own" on public.journal_active_entry;
create policy "journal_active_entry_insert_own" on public.journal_active_entry
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "journal_active_entry_update_own" on public.journal_active_entry;
create policy "journal_active_entry_update_own" on public.journal_active_entry
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "journal_active_entry_delete_own" on public.journal_active_entry;
create policy "journal_active_entry_delete_own" on public.journal_active_entry
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "journal_active_entry_select" on public.journal_active_entry;
drop policy if exists "admin read all" on public.journal_active_entry;
drop policy if exists "journal_active_entry_select_own" on public.journal_active_entry;
create policy "journal_active_entry_select" on public.journal_active_entry
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- journal_entries
drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own" on public.journal_entries
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own" on public.journal_entries
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own" on public.journal_entries
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "journal_entries_select" on public.journal_entries;
drop policy if exists "admin read all" on public.journal_entries;
drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select" on public.journal_entries
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- presets
drop policy if exists "presets_insert_own" on public.presets;
create policy "presets_insert_own" on public.presets
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "presets_update_own" on public.presets;
create policy "presets_update_own" on public.presets
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "presets_delete_own" on public.presets;
create policy "presets_delete_own" on public.presets
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "presets_select" on public.presets;
drop policy if exists "admin read all" on public.presets;
drop policy if exists "presets_select_own" on public.presets;
create policy "presets_select" on public.presets
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- time_logs
drop policy if exists "time_logs insert own" on public.time_logs;
create policy "time_logs insert own" on public.time_logs
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "time_logs update own" on public.time_logs;
create policy "time_logs update own" on public.time_logs
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "time_logs delete own" on public.time_logs;
create policy "time_logs delete own" on public.time_logs
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "time_logs_select" on public.time_logs;
drop policy if exists "admin read all" on public.time_logs;
drop policy if exists "time_logs select own" on public.time_logs;
create policy "time_logs_select" on public.time_logs
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);

-- user_progress
drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own" on public.user_progress
  for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own" on public.user_progress
  for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_progress_delete_own" on public.user_progress;
create policy "user_progress_delete_own" on public.user_progress
  for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "user_progress_select" on public.user_progress;
drop policy if exists "admin read all" on public.user_progress;
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select" on public.user_progress
  for select to public using ((select is_admin()) or (select auth.uid()) = user_id);


-- ── 3. invites: merge admin-read-all + public-read-unused SELECT ─────────────
-- Admin insert/update/delete policies (is_admin() only, single per action) are
-- left untouched. The public read of unused invites (for the join flow) is
-- preserved via the OR.
drop policy if exists "invites_select" on public.invites;
drop policy if exists "invites admin read all" on public.invites;
drop policy if exists "invites public read unused" on public.invites;
create policy "invites_select" on public.invites
  for select to public using ((select is_admin()) or (is_used = false));


-- ── 4. mentor_notes: split admin ALL + merge SELECT/UPDATE with student ──────
-- Replaces the admin "ALL" policy with per-action admin policies, merged with
-- the student read/mark-read policies. Student write is restricted to flipping
-- is_read (admin_id / student_id / note_text / entry_type must be unchanged).
drop policy if exists "mentor_notes_select" on public.mentor_notes;
drop policy if exists "mentor_notes_insert" on public.mentor_notes;
drop policy if exists "mentor_notes_update" on public.mentor_notes;
drop policy if exists "mentor_notes_delete" on public.mentor_notes;
drop policy if exists "mentor_notes admin all" on public.mentor_notes;
drop policy if exists "mentor_notes student read own" on public.mentor_notes;
drop policy if exists "mentor_notes student mark read" on public.mentor_notes;

create policy "mentor_notes_select" on public.mentor_notes
  for select to public using ((select is_admin()) or (select auth.uid()) = student_id);

create policy "mentor_notes_insert" on public.mentor_notes
  for insert to public with check ((select is_admin()));

create policy "mentor_notes_update" on public.mentor_notes
  for update to public
  using ((select is_admin()) or (select auth.uid()) = student_id)
  with check (
    (select is_admin())
    or (
      (select auth.uid()) = student_id
      and admin_id = (select mn.admin_id from public.mentor_notes mn where mn.id = mentor_notes.id)
      and student_id = (select mn.student_id from public.mentor_notes mn where mn.id = mentor_notes.id)
      and note_text = (select mn.note_text from public.mentor_notes mn where mn.id = mentor_notes.id)
      and entry_type = (select mn.entry_type from public.mentor_notes mn where mn.id = mentor_notes.id)
    )
  );

create policy "mentor_notes_delete" on public.mentor_notes
  for delete to public using ((select is_admin()));


-- ── 5. profiles: merge admin + self for SELECT and UPDATE ────────────────────
-- Self update is still restricted from changing role / is_active (no privilege
-- escalation); admin may update any field.
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles admin read all" on public.profiles;
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to public using ((select is_admin()) or (select auth.uid()) = id);

drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
drop policy if exists "profiles self update own non-role fields" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to public
  using ((select is_admin()) or (select auth.uid()) = id)
  with check (
    (select is_admin())
    or (
      (select auth.uid()) = id
      and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
      and is_active = (select p.is_active from public.profiles p where p.id = (select auth.uid()))
    )
  );


-- ── 6. Covering indexes for unindexed foreign keys ──────────────────────────
create index if not exists flags_admin_id_idx on public.flags (admin_id);
create index if not exists invites_created_by_idx on public.invites (created_by);
create index if not exists invites_used_by_idx on public.invites (used_by);
create index if not exists mentor_notes_admin_id_idx on public.mentor_notes (admin_id);
create index if not exists profiles_invited_by_idx on public.profiles (invited_by);


-- ── 7. Focus "Personal Best" RPC (replaces 10-year client-side scan) ────────
-- SECURITY INVOKER → respects RLS (focus_sessions select-own). Returns the
-- single highest daily total without transferring every session to the client.
create or replace function public.get_focus_all_time_pr()
returns table (pr_date text, total_seconds bigint)
language sql
stable
security invoker
set search_path to 'public'
as $$
  select fs.date::text as pr_date, sum(fs.duration_seconds)::bigint as total_seconds
  from public.focus_sessions fs
  where fs.user_id = (select auth.uid())
    and fs.duration_seconds is not null
  group by fs.date
  order by total_seconds desc
  limit 1;
$$;

revoke all on function public.get_focus_all_time_pr() from public;
grant execute on function public.get_focus_all_time_pr() to authenticated;


-- ── 8. Auth hardening: remove handle_new_user() RPC exposure ─────────────────
-- It is a trigger function (fires regardless of EXECUTE grants), so this does
-- NOT affect signup — it only removes the /rest/v1/rpc/handle_new_user surface.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- ============================================================================
-- End 0003_launch_hardening.sql
-- ============================================================================
