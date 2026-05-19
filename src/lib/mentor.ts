/**
 * Mentor service — student feedback (mentor_notes) and admin flags.
 * RLS rules enforce that students see only their own notes, never flags,
 * and that only admins can create notes/flags.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type {
  MentorNote,
  MentorNoteEntryType,
  Flag,
  Profile,
  UserRole,
} from '@/lib/types';

function rowToNote(row: Record<string, unknown>): MentorNote {
  return {
    id: row.id as string,
    adminId: row.admin_id as string,
    studentId: row.student_id as string,
    noteText: row.note_text as string,
    entryType: row.entry_type as MentorNoteEntryType,
    entryRefId: (row.entry_ref_id as string | null) ?? null,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  };
}

function rowToFlag(row: Record<string, unknown>): Flag {
  return {
    id: row.id as string,
    adminId: row.admin_id as string,
    studentId: row.student_id as string,
    reason: row.reason as string,
    resolved: row.resolved as boolean,
    createdAt: row.created_at as string,
  };
}

// ── Student-facing ──

export async function getMyMentorNotes(): Promise<MentorNote[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('mentor_notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToNote);
}

export async function getMyUnreadCount(): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('mentor_notes')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  if (error) return 0;
  return count ?? 0;
}

export async function markNoteRead(noteId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('mentor_notes')
    .update({ is_read: true })
    .eq('id', noteId);
  if (error) throw error;
}

export async function markAllNotesRead(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('mentor_notes')
    .update({ is_read: true })
    .eq('student_id', user.id)
    .eq('is_read', false);
}

// ── Admin-facing: students roster ──

export interface StudentSummary {
  profile: Profile;
  todayOperatorPct: number | null;
  todayOperatorDone: number | null;
  todayOperatorTotal: number | null;
  currentStreak: number;
  isFlagged: boolean;
}

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    role: row.role as UserRole,
    invitedBy: (row.invited_by as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    isActive: row.is_active as boolean,
    lastActiveAt: (row.last_active_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function listStudents(): Promise<StudentSummary[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const today = getTodayDateString();

  const [profilesRes, progressRes, summariesRes, flagsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
    supabase.from('user_progress').select('user_id, current_streak'),
    supabase.from('day_summaries').select('user_id, operator_pct, operator_done, operator_total').eq('date', today),
    supabase.from('flags').select('student_id, resolved').eq('resolved', false),
  ]);

  if (profilesRes.error) throw profilesRes.error;

  const progressByUser = new Map<string, number>();
  for (const row of progressRes.data || []) {
    progressByUser.set(row.user_id as string, (row.current_streak as number) ?? 0);
  }

  type SummaryRow = {
    user_id: string;
    operator_pct: number | null;
    operator_done: number | null;
    operator_total: number | null;
  };
  const summaryByUser = new Map<string, SummaryRow>();
  for (const row of (summariesRes.data || []) as SummaryRow[]) {
    summaryByUser.set(row.user_id, row);
  }

  const flaggedSet = new Set<string>();
  for (const row of flagsRes.data || []) {
    flaggedSet.add(row.student_id as string);
  }

  return (profilesRes.data || []).map((row) => {
    const profile = rowToProfile(row);
    const summary = summaryByUser.get(profile.id);
    return {
      profile,
      todayOperatorPct: summary?.operator_pct ?? null,
      todayOperatorDone: summary?.operator_done ?? null,
      todayOperatorTotal: summary?.operator_total ?? null,
      currentStreak: progressByUser.get(profile.id) ?? 0,
      isFlagged: flaggedSet.has(profile.id),
    };
  });
}

export async function getStudentProfile(studentId: string): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data);
}

export async function setStudentActive(studentId: string, isActive: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', studentId);
  if (error) throw error;
}

// ── Admin: mentor notes ──

export async function listNotesForStudent(studentId: string): Promise<MentorNote[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('mentor_notes')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToNote);
}

export async function createMentorNote(input: {
  studentId: string;
  noteText: string;
  entryType: MentorNoteEntryType;
  entryRefId?: string | null;
}): Promise<MentorNote> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('mentor_notes')
    .insert({
      admin_id: user.id,
      student_id: input.studentId,
      note_text: input.noteText,
      entry_type: input.entryType,
      entry_ref_id: input.entryRefId ?? null,
      is_read: false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToNote(data);
}

// ── Admin: flags ──

export async function listFlagsForStudent(studentId: string): Promise<Flag[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('flags')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToFlag);
}

export async function createFlag(studentId: string, reason: string): Promise<Flag> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('flags')
    .insert({
      admin_id: user.id,
      student_id: studentId,
      reason,
      resolved: false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToFlag(data);
}

export async function resolveFlag(flagId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('flags')
    .update({ resolved: true })
    .eq('id', flagId);
  if (error) throw error;
}
