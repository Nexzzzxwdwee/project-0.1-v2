import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ExportPayload,
  ExportDailyLog,
  ExportHabit,
  ExportHabitHistoryEntry,
  ExportDeepWorkEntry,
} from './types';

interface RawDayPlanItem {
  kind: 'habit' | 'task';
  text: string;
  completed: boolean;
}

interface RawDayPlan {
  date: string;
  items: RawDayPlanItem[] | null;
  is_sealed: boolean;
}

interface RawDaySummary {
  date: string;
  operator_pct: number | null;
}

interface RawFocusSession {
  date: string;
  duration_seconds: number | null;
  label: string | null;
}

interface RawTimeLog {
  date: string;
  interval_minutes: number;
  slots: Record<string, { activity?: string; baseline?: number }> | null;
  wins: string | null;
  learnt: string | null;
  tomorrow: string | null;
  notes: string | null;
}

interface RawJournalEntry {
  date: string;
  content: string;
}

interface RawGoal {
  text: string;
  tag: string | null;
  done: boolean;
  done_at: number | null;
  created_at: number | string;
}

interface RawMentorNote {
  note_text: string;
  entry_type: string;
  created_at: string;
}

interface RawProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

interface RawUserProgress {
  rank: string | null;
  xp: number | null;
  xp_to_next: number | null;
  current_streak: number | null;
  best_streak: number | null;
}

function wordCount(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function toIsoDate(value: number | string | null): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return new Date(value).toISOString();
  return value;
}

/**
 * Build the per-habit history index from every day_plan: for each item with
 * kind === 'habit', record the date and whether it was completed. Then derive
 * totalCompletions, currentStreak, longestStreak per habit name.
 */
function assembleHabits(dayPlans: RawDayPlan[]): ExportHabit[] {
  const byName = new Map<string, ExportHabitHistoryEntry[]>();

  const sorted = [...dayPlans].sort((a, b) => a.date.localeCompare(b.date));
  for (const dp of sorted) {
    for (const item of dp.items ?? []) {
      if (item.kind !== 'habit') continue;
      const list = byName.get(item.text) ?? [];
      list.push({ date: dp.date, completed: !!item.completed });
      byName.set(item.text, list);
    }
  }

  const result: ExportHabit[] = [];
  for (const [name, history] of byName.entries()) {
    const totalCompletions = history.filter(h => h.completed).length;
    const { current, longest } = streakStats(history);
    result.push({
      name,
      firstSeen: history[0]?.date ?? '',
      totalCompletions,
      currentStreak: current,
      longestStreak: longest,
      history,
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function streakStats(history: ExportHabitHistoryEntry[]): { current: number; longest: number } {
  let longest = 0;
  let run = 0;
  for (const entry of history) {
    if (entry.completed) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  // current streak = trailing consecutive completed days
  let current = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].completed) current += 1;
    else break;
  }
  return { current, longest };
}

function assembleDailyLogs(
  dayPlans: RawDayPlan[],
  daySummaries: RawDaySummary[],
  focusSessions: RawFocusSession[],
): ExportDailyLog[] {
  const summaryByDate = new Map(daySummaries.map(s => [s.date, s] as const));
  const focusByDate = new Map<string, ExportDeepWorkEntry[]>();
  for (const session of focusSessions) {
    const list = focusByDate.get(session.date) ?? [];
    list.push({
      activity: session.label ?? 'Deep work',
      durationMinutes: Math.round((session.duration_seconds ?? 0) / 60),
    });
    focusByDate.set(session.date, list);
  }

  const allDates = new Set<string>([
    ...dayPlans.map(p => p.date),
    ...daySummaries.map(s => s.date),
    ...focusSessions.map(f => f.date),
  ]);

  const rows: ExportDailyLog[] = [];
  for (const date of allDates) {
    const plan = dayPlans.find(p => p.date === date);
    const summary = summaryByDate.get(date);
    rows.push({
      date,
      operatorScore: summary?.operator_pct ?? null,
      habits: (plan?.items ?? [])
        .filter(i => i.kind === 'habit')
        .map(i => ({ name: i.text, completed: !!i.completed })),
      tasks: (plan?.items ?? [])
        .filter(i => i.kind === 'task')
        .map(i => ({ name: i.text, completed: !!i.completed })),
      deepWork: focusByDate.get(date) ?? [],
      sealed: plan?.is_sealed ?? false,
    });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fetch all data needed to build an ExportPayload for a single user.
 * Caller must pass a Supabase client whose RLS context permits reading
 * the target user's rows (either the user themselves, or an admin whose
 * "admin read all" policies are in force).
 */
export async function fetchExportForUser(
  userId: string,
  supabase: SupabaseClient,
): Promise<ExportPayload> {
  const [
    profileRes,
    progressRes,
    dayPlansRes,
    daySummariesRes,
    focusRes,
    timeLogsRes,
    journalRes,
    goalsRes,
    mentorNotesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email, role, created_at').eq('id', userId).maybeSingle(),
    supabase.from('user_progress').select('rank, xp, xp_to_next, current_streak, best_streak').eq('user_id', userId).maybeSingle(),
    supabase.from('day_plans').select('date, items, is_sealed').eq('user_id', userId),
    supabase.from('day_summaries').select('date, operator_pct').eq('user_id', userId),
    supabase.from('focus_sessions').select('date, duration_seconds, label').eq('user_id', userId),
    supabase.from('time_logs').select('date, interval_minutes, slots, wins, learnt, tomorrow, notes').eq('user_id', userId),
    supabase.from('journal_entries').select('date, content').eq('user_id', userId),
    supabase.from('goals').select('text, tag, done, done_at, created_at').eq('user_id', userId),
    supabase.from('mentor_notes').select('note_text, entry_type, created_at').eq('student_id', userId),
  ]);

  const profile = (profileRes.data as RawProfile | null) ?? {
    id: userId,
    display_name: null,
    email: null,
    role: 'student',
    created_at: new Date(0).toISOString(),
  };
  const progress = (progressRes.data as RawUserProgress | null) ?? {
    rank: null, xp: null, xp_to_next: null, current_streak: null, best_streak: null,
  };
  const dayPlans = (dayPlansRes.data ?? []) as RawDayPlan[];
  const daySummaries = (daySummariesRes.data ?? []) as RawDaySummary[];
  const focusSessions = (focusRes.data ?? []) as RawFocusSession[];
  const timeLogs = (timeLogsRes.data ?? []) as RawTimeLog[];
  const journalEntries = (journalRes.data ?? []) as RawJournalEntry[];
  const goals = (goalsRes.data ?? []) as RawGoal[];
  const mentorNotes = (mentorNotesRes.data ?? []) as RawMentorNote[];

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      email: profile.email,
      role: profile.role,
      joinDate: profile.created_at,
      currentRank: progress.rank ?? 'Recruit',
      currentXp: progress.xp ?? 0,
      xpToNext: progress.xp_to_next ?? 0,
      currentStreak: progress.current_streak ?? 0,
      bestStreak: progress.best_streak ?? 0,
    },
    dailyLogs: assembleDailyLogs(dayPlans, daySummaries, focusSessions),
    timeTracker: timeLogs
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(tl => ({
        date: tl.date,
        intervalMinutes: tl.interval_minutes,
        slots: Object.entries(tl.slots ?? {})
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, slot]) => ({
            time,
            activity: slot.activity ?? '',
            baseline: slot.baseline ?? 0,
          })),
        wins: tl.wins ?? '',
        learnt: tl.learnt ?? '',
        tomorrow: tl.tomorrow ?? '',
        notes: tl.notes ?? '',
      })),
    journal: journalEntries
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(j => ({
        date: j.date,
        content: j.content ?? '',
        wordCount: wordCount(j.content ?? ''),
      })),
    goals: goals
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .map(g => ({
        text: g.text,
        tag: g.tag ?? null,
        status: g.done ? 'completed' : 'active',
        createdAt: toIsoDate(g.created_at) ?? '',
        completedAt: toIsoDate(g.done_at),
      })),
    habits: assembleHabits(dayPlans),
    mentorNotes: mentorNotes
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(n => ({
        receivedAt: n.created_at,
        noteText: n.note_text,
        entryType: n.entry_type,
      })),
  };
}

/**
 * Build a safe filename slug from a display name (or fall back to user id).
 */
export function exportFilenameSlug(displayName: string | null, userId: string): string {
  const base = (displayName ?? userId).toLowerCase().trim();
  const slug = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'user';
}
