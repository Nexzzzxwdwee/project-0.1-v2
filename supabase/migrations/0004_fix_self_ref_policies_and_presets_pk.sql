-- ============================================================================
-- 0004: Fix onboarding blockers introduced/exposed by 0003
--
-- Problem 1 (profiles + mentor_notes): merging the admin + self policies into
-- a single OR'd policy combined with wrapping auth.uid() as (select auth.uid())
-- *inside WITH CHECK subqueries that read the same table* trips PostgreSQL's
-- recursion detector ("infinite recursion detected in policy for relation ...").
-- The original split policies with unwrapped auth.uid() in those subqueries
-- worked, so we restore them verbatim. We keep the initplan/permissive
-- optimizations on every other table — only the two tables whose policies
-- reference themselves in WITH CHECK revert.
--
-- Problem 2 (presets): the table's primary key was `(id)` alone, but the
-- application writes a literal preset id of 'default' for every user. The
-- first user got the row; every subsequent signup hits a PK conflict, falls
-- into the UPSERT's UPDATE branch, and trips the own-row RLS USING. Fix the
-- key to `(user_id, id)` so each user's preset namespace is independent.
-- Existing rows already have unique (user_id, id) tuples.
--
-- Idempotent — safe to re-run.
-- ============================================================================


-- ── 1. profiles: restore original 4 policies (unwrapped auth.uid in subqueries)
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles admin read all" on public.profiles;
drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
drop policy if exists "profiles self update own non-role fields" on public.profiles;

create policy "profiles admin read all" on public.profiles
  for select to public using (is_admin());
create policy "profiles self read" on public.profiles
  for select to public using (auth.uid() = id);
create policy "profiles admin update" on public.profiles
  for update to public using (is_admin()) with check (is_admin());
create policy "profiles self update own non-role fields" on public.profiles
  for update to public
  using (auth.uid() = id)
  with check (
    (auth.uid() = id)
    and (role = (select profiles_1.role from public.profiles profiles_1 where profiles_1.id = auth.uid()))
    and (is_active = (select profiles_1.is_active from public.profiles profiles_1 where profiles_1.id = auth.uid()))
  );


-- ── 2. mentor_notes: restore original 3 policies (unwrapped auth.uid throughout)
drop policy if exists "mentor_notes_select" on public.mentor_notes;
drop policy if exists "mentor_notes_insert" on public.mentor_notes;
drop policy if exists "mentor_notes_update" on public.mentor_notes;
drop policy if exists "mentor_notes_delete" on public.mentor_notes;
drop policy if exists "mentor_notes admin all" on public.mentor_notes;
drop policy if exists "mentor_notes student read own" on public.mentor_notes;
drop policy if exists "mentor_notes student mark read" on public.mentor_notes;

create policy "mentor_notes admin all" on public.mentor_notes
  for all to public using (is_admin()) with check (is_admin());
create policy "mentor_notes student read own" on public.mentor_notes
  for select to public using (auth.uid() = student_id);
create policy "mentor_notes student mark read" on public.mentor_notes
  for update to public
  using (auth.uid() = student_id)
  with check (
    (auth.uid() = student_id)
    and (admin_id = (select mn.admin_id from public.mentor_notes mn where mn.id = mentor_notes.id))
    and (student_id = (select mn.student_id from public.mentor_notes mn where mn.id = mentor_notes.id))
    and (note_text = (select mn.note_text from public.mentor_notes mn where mn.id = mentor_notes.id))
    and (entry_type = (select mn.entry_type from public.mentor_notes mn where mn.id = mentor_notes.id))
  );


-- ── 3. presets: composite primary key (user_id, id) so users can't collide
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.presets'::regclass
      and contype = 'p'
      and conname = 'presets_pkey'
  ) then
    alter table public.presets drop constraint presets_pkey;
  end if;
end $$;

alter table public.presets add primary key (user_id, id);

-- ============================================================================
-- End 0004_fix_self_ref_policies_and_presets_pk.sql
-- ============================================================================
