-- ============================================================================
-- DOWN / revert for 0003_launch_hardening.sql
-- Restores the exact pre-0003 policy set, drops the added indexes + RPC, and
-- re-grants handle_new_user() EXECUTE. Idempotent — safe to re-run.
-- Run this to revert if the RLS test checklist surfaces any problem.
-- ============================================================================

-- ── 1. Own-row-only tables: restore unwrapped auth.uid() ────────────────────
drop policy if exists "Users can select own budget" on public.dca_budget;
create policy "Users can select own budget" on public.dca_budget for select to public using (auth.uid() = user_id);
drop policy if exists "Users can insert own budget" on public.dca_budget;
create policy "Users can insert own budget" on public.dca_budget for insert to public with check (auth.uid() = user_id);
drop policy if exists "Users can update own budget" on public.dca_budget;
create policy "Users can update own budget" on public.dca_budget for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can select own entries" on public.dca_plan_entries;
create policy "Users can select own entries" on public.dca_plan_entries for select to public using (auth.uid() = user_id);
drop policy if exists "Users can insert own entries" on public.dca_plan_entries;
create policy "Users can insert own entries" on public.dca_plan_entries for insert to public with check (auth.uid() = user_id);
drop policy if exists "Users can delete own entries" on public.dca_plan_entries;
create policy "Users can delete own entries" on public.dca_plan_entries for delete to public using (auth.uid() = user_id);

drop policy if exists "Users can select own trades" on public.trades;
create policy "Users can select own trades" on public.trades for select to public using (auth.uid() = user_id);
drop policy if exists "Users can insert own trades" on public.trades;
create policy "Users can insert own trades" on public.trades for insert to public with check (auth.uid() = user_id);
drop policy if exists "Users can update own trades" on public.trades;
create policy "Users can update own trades" on public.trades for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own trades" on public.trades;
create policy "Users can delete own trades" on public.trades for delete to public using (auth.uid() = user_id);

drop policy if exists "Users can select own accounts" on public.trading_accounts;
create policy "Users can select own accounts" on public.trading_accounts for select to public using (auth.uid() = user_id);
drop policy if exists "Users can insert own accounts" on public.trading_accounts;
create policy "Users can insert own accounts" on public.trading_accounts for insert to public with check (auth.uid() = user_id);
drop policy if exists "Users can update own accounts" on public.trading_accounts;
create policy "Users can update own accounts" on public.trading_accounts for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own accounts" on public.trading_accounts;
create policy "Users can delete own accounts" on public.trading_accounts for delete to public using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions for select to public using (auth.uid() = user_id);
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions for insert to public with check (auth.uid() = user_id);
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions for delete to public using (auth.uid() = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings for select to public using (auth.uid() = user_id);
drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings for insert to public with check (auth.uid() = user_id);
drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own" on public.user_settings for delete to public using (auth.uid() = user_id);

-- ── 2. Merge tables: restore split admin-read-all + own policies ─────────────
drop policy if exists "day_plans_select" on public.day_plans;
drop policy if exists "day_plans_insert_own" on public.day_plans;
create policy "day_plans_insert_own" on public.day_plans for insert to public with check (auth.uid() = user_id);
drop policy if exists "day_plans_update_own" on public.day_plans;
create policy "day_plans_update_own" on public.day_plans for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "day_plans_delete_own" on public.day_plans;
create policy "day_plans_delete_own" on public.day_plans for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.day_plans;
create policy "admin read all" on public.day_plans for select to public using (is_admin());
drop policy if exists "day_plans_select_own" on public.day_plans;
create policy "day_plans_select_own" on public.day_plans for select to public using (auth.uid() = user_id);

drop policy if exists "day_summaries_select" on public.day_summaries;
drop policy if exists "day_summaries_insert_own" on public.day_summaries;
create policy "day_summaries_insert_own" on public.day_summaries for insert to public with check (auth.uid() = user_id);
drop policy if exists "day_summaries_update_own" on public.day_summaries;
create policy "day_summaries_update_own" on public.day_summaries for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "day_summaries_delete_own" on public.day_summaries;
create policy "day_summaries_delete_own" on public.day_summaries for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.day_summaries;
create policy "admin read all" on public.day_summaries for select to public using (is_admin());
drop policy if exists "day_summaries_select_own" on public.day_summaries;
create policy "day_summaries_select_own" on public.day_summaries for select to public using (auth.uid() = user_id);

drop policy if exists "focus_sessions_select" on public.focus_sessions;
drop policy if exists "Users can insert own focus sessions" on public.focus_sessions;
create policy "Users can insert own focus sessions" on public.focus_sessions for insert to public with check (auth.uid() = user_id);
drop policy if exists "Users can update own focus sessions" on public.focus_sessions;
create policy "Users can update own focus sessions" on public.focus_sessions for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own focus sessions" on public.focus_sessions;
create policy "Users can delete own focus sessions" on public.focus_sessions for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.focus_sessions;
create policy "admin read all" on public.focus_sessions for select to public using (is_admin());
drop policy if exists "Users can read own focus sessions" on public.focus_sessions;
create policy "Users can read own focus sessions" on public.focus_sessions for select to public using (auth.uid() = user_id);

drop policy if exists "goals_select" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals for insert to public with check (auth.uid() = user_id);
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.goals;
create policy "admin read all" on public.goals for select to public using (is_admin());
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals for select to public using (auth.uid() = user_id);

drop policy if exists "journal_active_entry_select" on public.journal_active_entry;
drop policy if exists "journal_active_entry_insert_own" on public.journal_active_entry;
create policy "journal_active_entry_insert_own" on public.journal_active_entry for insert to public with check (auth.uid() = user_id);
drop policy if exists "journal_active_entry_update_own" on public.journal_active_entry;
create policy "journal_active_entry_update_own" on public.journal_active_entry for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "journal_active_entry_delete_own" on public.journal_active_entry;
create policy "journal_active_entry_delete_own" on public.journal_active_entry for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.journal_active_entry;
create policy "admin read all" on public.journal_active_entry for select to public using (is_admin());
drop policy if exists "journal_active_entry_select_own" on public.journal_active_entry;
create policy "journal_active_entry_select_own" on public.journal_active_entry for select to public using (auth.uid() = user_id);

drop policy if exists "journal_entries_select" on public.journal_entries;
drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own" on public.journal_entries for insert to public with check (auth.uid() = user_id);
drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own" on public.journal_entries for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own" on public.journal_entries for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.journal_entries;
create policy "admin read all" on public.journal_entries for select to public using (is_admin());
drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select_own" on public.journal_entries for select to public using (auth.uid() = user_id);

drop policy if exists "presets_select" on public.presets;
drop policy if exists "presets_insert_own" on public.presets;
create policy "presets_insert_own" on public.presets for insert to public with check (auth.uid() = user_id);
drop policy if exists "presets_update_own" on public.presets;
create policy "presets_update_own" on public.presets for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "presets_delete_own" on public.presets;
create policy "presets_delete_own" on public.presets for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.presets;
create policy "admin read all" on public.presets for select to public using (is_admin());
drop policy if exists "presets_select_own" on public.presets;
create policy "presets_select_own" on public.presets for select to public using (auth.uid() = user_id);

drop policy if exists "time_logs_select" on public.time_logs;
drop policy if exists "time_logs insert own" on public.time_logs;
create policy "time_logs insert own" on public.time_logs for insert to public with check (auth.uid() = user_id);
drop policy if exists "time_logs update own" on public.time_logs;
create policy "time_logs update own" on public.time_logs for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "time_logs delete own" on public.time_logs;
create policy "time_logs delete own" on public.time_logs for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.time_logs;
create policy "admin read all" on public.time_logs for select to public using (is_admin());
drop policy if exists "time_logs select own" on public.time_logs;
create policy "time_logs select own" on public.time_logs for select to public using (auth.uid() = user_id);

drop policy if exists "user_progress_select" on public.user_progress;
drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own" on public.user_progress for insert to public with check (auth.uid() = user_id);
drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own" on public.user_progress for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_progress_delete_own" on public.user_progress;
create policy "user_progress_delete_own" on public.user_progress for delete to public using (auth.uid() = user_id);
drop policy if exists "admin read all" on public.user_progress;
create policy "admin read all" on public.user_progress for select to public using (is_admin());
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own" on public.user_progress for select to public using (auth.uid() = user_id);

-- ── 3. invites ──────────────────────────────────────────────────────────────
drop policy if exists "invites_select" on public.invites;
drop policy if exists "invites admin read all" on public.invites;
create policy "invites admin read all" on public.invites for select to public using (is_admin());
drop policy if exists "invites public read unused" on public.invites;
create policy "invites public read unused" on public.invites for select to public using (is_used = false);

-- ── 4. mentor_notes ─────────────────────────────────────────────────────────
drop policy if exists "mentor_notes_select" on public.mentor_notes;
drop policy if exists "mentor_notes_insert" on public.mentor_notes;
drop policy if exists "mentor_notes_update" on public.mentor_notes;
drop policy if exists "mentor_notes_delete" on public.mentor_notes;
drop policy if exists "mentor_notes admin all" on public.mentor_notes;
create policy "mentor_notes admin all" on public.mentor_notes for all to public using (is_admin()) with check (is_admin());
drop policy if exists "mentor_notes student read own" on public.mentor_notes;
create policy "mentor_notes student read own" on public.mentor_notes for select to public using (auth.uid() = student_id);
drop policy if exists "mentor_notes student mark read" on public.mentor_notes;
create policy "mentor_notes student mark read" on public.mentor_notes for update to public
  using (auth.uid() = student_id)
  with check ((auth.uid() = student_id)
    and (admin_id = (select mn.admin_id from mentor_notes mn where mn.id = mentor_notes.id))
    and (student_id = (select mn.student_id from mentor_notes mn where mn.id = mentor_notes.id))
    and (note_text = (select mn.note_text from mentor_notes mn where mn.id = mentor_notes.id))
    and (entry_type = (select mn.entry_type from mentor_notes mn where mn.id = mentor_notes.id)));

-- ── 5. profiles ─────────────────────────────────────────────────────────────
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles admin read all" on public.profiles;
create policy "profiles admin read all" on public.profiles for select to public using (is_admin());
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select to public using (auth.uid() = id);
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update to public using (is_admin()) with check (is_admin());
drop policy if exists "profiles self update own non-role fields" on public.profiles;
create policy "profiles self update own non-role fields" on public.profiles for update to public
  using (auth.uid() = id)
  with check ((auth.uid() = id)
    and (role = (select profiles_1.role from profiles profiles_1 where profiles_1.id = auth.uid()))
    and (is_active = (select profiles_1.is_active from profiles profiles_1 where profiles_1.id = auth.uid())));

-- ── 6. Drop added indexes + RPC, restore handle_new_user grants ─────────────
drop index if exists public.flags_admin_id_idx;
drop index if exists public.invites_created_by_idx;
drop index if exists public.invites_used_by_idx;
drop index if exists public.mentor_notes_admin_id_idx;
drop index if exists public.profiles_invited_by_idx;

drop function if exists public.get_focus_all_time_pr();

grant execute on function public.handle_new_user() to anon, authenticated;

-- ============================================================================
-- End 0003_launch_hardening_down.sql
-- ============================================================================
