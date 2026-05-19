-- ============================================================================
-- Operators: invite-only auth, roles, mentor notes, flags, invites
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── Profiles ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('admin', 'student')),
  invited_by uuid references public.profiles(id) on delete set null,
  display_name text,
  email text,
  is_active boolean not null default true,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ── Invites ─────────────────────────────────────────────────────────────────

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  created_by uuid references public.profiles(id) on delete set null,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  is_used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists invites_code_idx on public.invites (code);
create index if not exists invites_unused_idx on public.invites (is_used) where is_used = false;

-- ── Mentor notes ────────────────────────────────────────────────────────────

create table if not exists public.mentor_notes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  note_text text not null,
  entry_type text not null default 'general'
    check (entry_type in ('journal', 'goal', 'habit', 'time_log', 'general')),
  entry_ref_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mentor_notes_student_idx
  on public.mentor_notes (student_id, created_at desc);
create index if not exists mentor_notes_unread_idx
  on public.mentor_notes (student_id) where is_read = false;

-- ── Flags ───────────────────────────────────────────────────────────────────

create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists flags_student_idx on public.flags (student_id);
create index if not exists flags_open_idx on public.flags (student_id) where resolved = false;

-- ── Helper: is_admin() ──────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- ── Trigger: handle_new_user (auto-create profile + redeem invite) ─────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_code text;
  v_display_name text;
  v_app_role text;
  v_invite public.invites%rowtype;
begin
  v_app_role := new.raw_app_meta_data->>'role';
  v_display_name := nullif(new.raw_user_meta_data->>'display_name', '');
  v_invite_code := nullif(new.raw_user_meta_data->>'invite_code', '');

  -- Admin bootstrap path: only the service role can set raw_app_meta_data.
  -- Use Supabase Dashboard → Authentication → Users → Add User with
  -- app_metadata = { "role": "admin" } to create the first admin.
  if v_app_role = 'admin' then
    insert into public.profiles (id, email, role, display_name)
    values (new.id, new.email, 'admin', coalesce(v_display_name, new.email))
    on conflict (id) do update
      set role = excluded.role,
          display_name = coalesce(excluded.display_name, public.profiles.display_name);
    return new;
  end if;

  -- Student path: require a valid, unused, unexpired invite.
  if v_invite_code is null then
    raise exception 'Sign-up requires a valid invite code.';
  end if;

  select * into v_invite
  from public.invites
  where code = v_invite_code
    and is_used = false
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'Invite code is invalid, already used, or expired.';
  end if;

  insert into public.profiles (id, email, role, invited_by, display_name)
  values (new.id, new.email, 'student', v_invite.created_by, coalesce(v_display_name, new.email));

  update public.invites
  set is_used = true, used_by = new.id, used_at = now()
  where id = v_invite.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS: profiles ───────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles admin read all" on public.profiles;
create policy "profiles admin read all"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "profiles self update own non-role fields" on public.profiles;
create policy "profiles self update own non-role fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- prevent users from escalating their own role
    and role = (select role from public.profiles where id = auth.uid())
    and is_active = (select is_active from public.profiles where id = auth.uid())
  );

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── RLS: invites ────────────────────────────────────────────────────────────

alter table public.invites enable row level security;

-- Anonymous + authenticated users can look up an unused invite by code
-- (so the /join page can validate before signup).
drop policy if exists "invites public read unused" on public.invites;
create policy "invites public read unused"
  on public.invites for select
  using (is_used = false);

drop policy if exists "invites admin read all" on public.invites;
create policy "invites admin read all"
  on public.invites for select
  using (public.is_admin());

drop policy if exists "invites admin insert" on public.invites;
create policy "invites admin insert"
  on public.invites for insert
  with check (public.is_admin());

drop policy if exists "invites admin update" on public.invites;
create policy "invites admin update"
  on public.invites for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "invites admin delete" on public.invites;
create policy "invites admin delete"
  on public.invites for delete
  using (public.is_admin());

-- ── RLS: mentor_notes ───────────────────────────────────────────────────────

alter table public.mentor_notes enable row level security;

drop policy if exists "mentor_notes student read own" on public.mentor_notes;
create policy "mentor_notes student read own"
  on public.mentor_notes for select
  using (auth.uid() = student_id);

drop policy if exists "mentor_notes student mark read" on public.mentor_notes;
create policy "mentor_notes student mark read"
  on public.mentor_notes for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    -- student can only toggle is_read; text/type/refs are admin-managed
    and admin_id = (select admin_id from public.mentor_notes mn where mn.id = mentor_notes.id)
    and student_id = (select student_id from public.mentor_notes mn where mn.id = mentor_notes.id)
    and note_text = (select note_text from public.mentor_notes mn where mn.id = mentor_notes.id)
    and entry_type = (select entry_type from public.mentor_notes mn where mn.id = mentor_notes.id)
  );

drop policy if exists "mentor_notes admin all" on public.mentor_notes;
create policy "mentor_notes admin all"
  on public.mentor_notes for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── RLS: flags (admin only — students cannot see) ──────────────────────────

alter table public.flags enable row level security;

drop policy if exists "flags admin all" on public.flags;
create policy "flags admin all"
  on public.flags for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── Admin read-all access to existing user-scoped tables ───────────────────
-- Each block runs only if the table already exists in this Supabase project,
-- so this migration is safe to apply regardless of which earlier tables
-- have been set up.

do $$
declare
  t record;
begin
  for t in
    select unnest(array[
      'presets',
      'day_plans',
      'day_summaries',
      'user_progress',
      'journal_entries',
      'journal_active_entry',
      'goals',
      'focus_sessions',
      'time_logs'
    ]) as table_name
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t.table_name
    ) then
      execute format('alter table public.%I enable row level security', t.table_name);
      execute format('drop policy if exists "admin read all" on public.%I', t.table_name);
      execute format(
        'create policy "admin read all" on public.%I for select using (public.is_admin())',
        t.table_name
      );
    end if;
  end loop;
end $$;
