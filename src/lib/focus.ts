/**
 * Focus / Deep Work service layer
 * All operations go directly through Supabase (focus_sessions table)
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { FocusSession, FocusDailyTotal } from '@/lib/types';

// ── Helpers ─────────────────────────────────────────────────────

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.getFullYear(), d.getMonth(), diff);
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
}

async function getUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  return user.id;
}

function rowToSession(row: any): FocusSession {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    label: row.label,
    notes: row.notes,
    date: row.date,
    createdAt: row.created_at,
  };
}

// ── CRUD ────────────────────────────────────────────────────────

export async function startSession(userId: string, label?: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const now = new Date().toISOString();

  // Close any prior open session for this user. If a previous endSession
  // failed mid-write, the row would still have ended_at = null and
  // getActiveSession would re-attach it on the next load. Mark them
  // ended at zero duration so we never start with an orphan in flight.
  await supabase
    .from('focus_sessions')
    .update({ ended_at: now, duration_seconds: 0 })
    .eq('user_id', userId)
    .is('ended_at', null);

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: userId,
      started_at: now,
      label: label || null,
      date: getTodayDateString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function endSession(sessionId: string, durationSeconds: number, notes?: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('focus_sessions')
    .update({
      ended_at: now,
      duration_seconds: Math.round(durationSeconds),
      notes: notes || null,
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function getActiveSession(userId: string): Promise<FocusSession | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToSession(data) : null;
}

export async function getSessionsByDate(userId: string, date: string): Promise<FocusSession[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('started_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(rowToSession);
}

export async function getSessionsByDateRange(userId: string, from: string, to: string): Promise<FocusSession[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('started_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(rowToSession);
}

export async function getDailyTotals(userId: string, days: number): Promise<FocusDailyTotal[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('date, duration_seconds')
    .eq('user_id', userId)
    .gte('date', fromStr)
    .not('duration_seconds', 'is', null)
    .order('date', { ascending: true });

  if (error) throw error;

  const map = new Map<string, { total: number; count: number }>();
  for (const row of data || []) {
    const existing = map.get(row.date) || { total: 0, count: 0 };
    existing.total += row.duration_seconds || 0;
    existing.count += 1;
    map.set(row.date, existing);
  }

  return Array.from(map.entries()).map(([date, v]) => ({
    date,
    totalSeconds: v.total,
    sessionCount: v.count,
  }));
}

export async function getWeeklyTotal(userId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const monday = getMondayISO();

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration_seconds')
    .eq('user_id', userId)
    .gte('date', monday)
    .not('duration_seconds', 'is', null);

  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
}

export async function getAllTimePR(userId: string): Promise<{ date: string; totalSeconds: number } | null> {
  const totals = await getDailyTotals(userId, 3650); // ~10 years
  if (totals.length === 0) return null;
  let best = totals[0];
  for (const t of totals) {
    if (t.totalSeconds > best.totalSeconds) best = t;
  }
  return { date: best.date, totalSeconds: best.totalSeconds };
}

export async function getTodayTotal(userId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const today = getTodayDateString();
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration_seconds')
    .eq('user_id', userId)
    .eq('date', today)
    .not('duration_seconds', 'is', null);

  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('focus_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getCurrentUserId(): Promise<string> {
  return getUserId();
}
