-- Default user_id to auth.uid() so inserts can’t forget it (works only when authenticated)
alter table if exists public.presets alter column user_id set default auth.uid();
alter table if exists public.day_plans alter column user_id set default auth.uid();
alter table if exists public.day_summaries alter column user_id set default auth.uid();
alter table if exists public.user_progress alter column user_id set default auth.uid();
alter table if exists public.journal_entries alter column user_id set default auth.uid();
alter table if exists public.journal_active_entry alter column user_id set default auth.uid();
alter table if exists public.goals alter column user_id set default auth.uid();
alter table if exists public.user_settings alter column user_id set default auth.uid();
