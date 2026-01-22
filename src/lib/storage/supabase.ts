/**
 * Supabase adapter implementation
 * Handles all CRUD operations against Supabase tables
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type {
  Preset,
  PresetId,
  DayPlan,
  DayPlanItem,
  DaySummary,
  UserProgress,
} from '@/lib/presets';
import type { StorageAdapter } from './types';
import type { JournalEntry } from '@/app/(app)/journal/page';
import type { Goal } from '@/app/(app)/goals/page';

// Cache user ID to avoid repeated auth calls (prevents lock conflicts)
let cachedUserId: string | null = null;
let userIdPromise: Promise<string> | null = null;

/**
 * Get current authenticated user ID (cached)
 * Throws if not authenticated
 * 
 * IMPORTANT: This caches the user ID to prevent repeated getUser() calls
 * that can cause AbortError from auth locks. The cache is module-level
 * and persists for the adapter instance lifetime.
 */
async function getUserId(): Promise<string> {
  // Return cached user ID if available
  if (cachedUserId) {
    return cachedUserId;
  }

  // If there's an in-flight request, wait for it instead of creating a new one
  if (userIdPromise) {
    return userIdPromise;
  }

  // Create new promise to fetch user ID
  userIdPromise = (async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      userIdPromise = null;
      throw new Error('Supabase client not configured');
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      userIdPromise = null;
      throw new Error('Not signed in — refresh and try again.');
    }

    cachedUserId = user.id;
    userIdPromise = null;
    return user.id;
  })();

  return userIdPromise;
}

/**
 * Require a user ID for write operations
 * Throws a friendly error if user is missing
 */
async function requireUserId(): Promise<string> {
  try {
    return await getUserId();
  } catch (err) {
    if (err instanceof Error && err.message) {
      throw err;
    }
    throw new Error('Not signed in — refresh and try again.');
  }
}

/**
 * Clear cached user ID (call when auth state changes)
 */
function clearUserIdCache(): void {
  cachedUserId = null;
  userIdPromise = null;
}

/**
 * Supabase adapter implementation
 */
export function supabaseAdapter(): StorageAdapter {
  return {
    // Preset operations
    async getPresets(): Promise<Record<PresetId, Preset>> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to fetch presets:', error);
        throw error;
      }

      const presets: Record<PresetId, Preset> = {};
      if (data) {
        for (const row of data) {
          presets[row.id] = {
            id: row.id,
            name: row.name,
            habits: row.habits || [],
            tasks: row.tasks || [],
            updatedAt: row.updated_at,
          };
        }
      }

      return presets;
    },

    async savePresets(presets: Record<PresetId, Preset>): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await requireUserId();

      // Fetch existing preset IDs for this user to determine what to delete
      const { data: existingRows, error: fetchError } = await supabase
        .from('presets')
        .select('id')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Failed to fetch existing presets:', fetchError);
        throw fetchError;
      }

      const existingIds = new Set(existingRows?.map((row) => row.id) || []);
      const newIds = new Set(Object.keys(presets));

      // Compute IDs to delete: presets that exist in DB but not in the new presets object
      const idsToDelete = Array.from(existingIds).filter((id) => !newIds.has(id));

      // If RLS is enabled on presets table, a DELETE policy is required or deletion will fail.
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('presets')
          .delete()
          .eq('user_id', userId)
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('Failed to delete presets:', deleteError);
          throw deleteError;
        }
      }

      // Edge case: if presets object is empty, we've deleted everything, skip upsert
      if (Object.keys(presets).length === 0) {
        return;
      }

      // Convert to array and upsert remaining presets
      // Note: created_at is omitted to avoid overwriting on updates
      // Supabase should handle created_at via default value or trigger
      const rows = Object.values(presets).map((preset) => ({
        id: preset.id,
        user_id: userId,
        name: preset.name,
        habits: preset.habits,
        tasks: preset.tasks,
        updated_at: preset.updatedAt,
      }));

      const { error: upsertError } = await supabase
        .from('presets')
        .upsert(rows, { onConflict: 'id' });

      if (upsertError) {
        console.error('Failed to save presets:', upsertError);
        throw upsertError;
      }
    },

    async getActivePresetId(): Promise<PresetId | null> {
      const userId = await getUserId();
      const progress = await this.getUserProgress();
      return progress?.activePresetId || null;
    },

    async setActivePresetId(presetId: PresetId): Promise<void> {
      await requireUserId();
      const progress = await this.getUserProgress();
      
      const updated: UserProgress = progress || {
        xp: 0,
        rank: 'Novice',
        xpToNext: 100,
        bestStreak: 0,
        currentStreak: 0,
        lastSealedDate: null,
        updatedAt: Date.now(),
        activePresetId: presetId,
      };

      updated.activePresetId = presetId;
      updated.updatedAt = Date.now();
      await this.saveUserProgress(updated);
    },

    // Day plan operations
    async getDayPlan(date: string): Promise<DayPlan> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const id = `${userId}:${date}`;

      const { data, error } = await supabase
        .from('day_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Failed to fetch day plan:', error);
        throw error;
      }

      if (!data) {
        return {
          date,
          activePresetId: null,
          presetUpdatedAt: null,
          items: [],
          archived: [],
          isSealed: false,
        };
      }

      return {
        date: data.date,
        activePresetId: data.active_preset_id,
        presetUpdatedAt: data.preset_updated_at,
        items: (data.items || []) as DayPlanItem[],
        archived: (data.archived || []) as DayPlanItem[],
        isSealed: data.is_sealed,
      };
    },

    async saveDayPlan(plan: DayPlan): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await requireUserId();
      const id = `${userId}:${plan.date}`;

      const { error } = await supabase
        .from('day_plans')
        .upsert({
          id,
          user_id: userId,
          date: plan.date,
          active_preset_id: plan.activePresetId,
          preset_updated_at: plan.presetUpdatedAt,
          items: plan.items,
          archived: plan.archived,
          is_sealed: plan.isSealed,
          updated_at: Date.now(),
        }, { onConflict: 'id' });

      if (error) {
        console.error('Failed to save day plan:', error);
        throw error;
      }
    },

    async listDayPlanDates(): Promise<string[]> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const { data, error } = await supabase
        .from('day_plans')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to list day plans:', error);
        throw error;
      }

      return (data || []).map((row) => row.date);
    },

    // Day summary operations
    async getDaySummary(date: string): Promise<DaySummary | null> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const id = `${userId}:${date}`;

      const { data, error } = await supabase
        .from('day_summaries')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch day summary:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        date: data.date,
        operatorPct: data.operator_pct,
        operatorTotal: data.operator_total,
        operatorDone: data.operator_done,
        isSealed: data.is_sealed,
        sealedAt: data.sealed_at,
        totalScorePct: data.total_score_pct,
        habitsPct: data.habits_pct,
        tasksPctCapped: data.tasks_pct_capped,
        habitsTotal: data.habits_total,
        habitsDone: data.habits_done,
        tasksTotal: data.tasks_total,
        tasksDone: data.tasks_done,
        status: data.status as DaySummary['status'],
        xpEarned: data.xp_earned,
      };
    },

    async saveDaySummary(summary: DaySummary): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await requireUserId();
      const id = `${userId}:${summary.date}`;

      const { error } = await supabase
        .from('day_summaries')
        .upsert({
          id,
          user_id: userId,
          date: summary.date,
          operator_pct: summary.operatorPct,
          operator_total: summary.operatorTotal,
          operator_done: summary.operatorDone,
          is_sealed: summary.isSealed,
          sealed_at: summary.sealedAt,
          total_score_pct: summary.totalScorePct,
          habits_pct: summary.habitsPct,
          tasks_pct_capped: summary.tasksPctCapped,
          habits_total: summary.habitsTotal,
          habits_done: summary.habitsDone,
          tasks_total: summary.tasksTotal,
          tasks_done: summary.tasksDone,
          status: summary.status,
          xp_earned: summary.xpEarned,
          created_at: Date.now(),
        }, { onConflict: 'id' });

      if (error) {
        console.error('Failed to save day summary:', error);
        throw error;
      }
    },

    async getAllSealedDaySummaries(): Promise<DaySummary[]> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const { data, error } = await supabase
        .from('day_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sealed', true)
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to fetch sealed summaries:', error);
        throw error;
      }

      return (data || []).map((row) => ({
        date: row.date,
        operatorPct: row.operator_pct,
        operatorTotal: row.operator_total,
        operatorDone: row.operator_done,
        isSealed: row.is_sealed,
        sealedAt: row.sealed_at,
        totalScorePct: row.total_score_pct,
        habitsPct: row.habits_pct,
        tasksPctCapped: row.tasks_pct_capped,
        habitsTotal: row.habits_total,
        habitsDone: row.habits_done,
        tasksTotal: row.tasks_total,
        tasksDone: row.tasks_done,
        status: row.status as DaySummary['status'],
        xpEarned: row.xp_earned,
      }));
    },

    // User progress operations
    async getUserProgress(): Promise<UserProgress | null> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const id = userId;

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch user progress:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        xp: data.xp,
        rank: data.rank,
        xpToNext: data.xp_to_next,
        bestStreak: data.best_streak,
        currentStreak: data.current_streak,
        lastSealedDate: data.last_sealed_date,
        updatedAt: data.updated_at,
        activePresetId: data.active_preset_id,
      };
    },

    async saveUserProgress(progress: UserProgress): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await requireUserId();
      const id = userId;

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          id,
          user_id: userId,
          xp: progress.xp,
          rank: progress.rank,
          xp_to_next: progress.xpToNext,
          best_streak: progress.bestStreak,
          current_streak: progress.currentStreak,
          last_sealed_date: progress.lastSealedDate,
          active_preset_id: progress.activePresetId || null,
          updated_at: progress.updatedAt,
        }, { onConflict: 'id' });

      if (error) {
        console.error('Failed to save user progress:', error);
        throw error;
      }
    },

    async updateUserProgress(updater: (prev: UserProgress) => UserProgress): Promise<void> {
      await requireUserId();
      const current = await this.getUserProgress();
      if (!current) {
        const defaultProgress: UserProgress = {
          xp: 0,
          rank: 'Novice',
          xpToNext: 100,
          bestStreak: 0,
          currentStreak: 0,
          lastSealedDate: null,
          updatedAt: Date.now(),
        };
        await this.saveUserProgress(updater(defaultProgress));
      } else {
        await this.saveUserProgress(updater(current));
      }
    },

    // Journal operations
    async getJournalEntries(): Promise<JournalEntry[]> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch journal entries:', error);
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        date: row.date,
        content: row.content,
      }));
    },

    async saveJournalEntries(entries: JournalEntry[]): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await requireUserId();
      const rows = entries.map((entry) => ({
        id: entry.id,
        user_id: userId,
        date: entry.date,
        content: entry.content,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
      }));

      const { error } = await supabase
        .from('journal_entries')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.error('Failed to save journal entries:', error);
        throw error;
      }
    },

    async getActiveEntryId(): Promise<string | null> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const id = userId;

      const { data, error } = await supabase
        .from('journal_active_entry')
        .select('active_entry_id')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch active entry:', error);
        throw error;
      }

      return data?.active_entry_id || null;
    },

    async setActiveEntryId(entryId: string | null): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await requireUserId();
      const id = userId;

      const { error } = await supabase
        .from('journal_active_entry')
        .upsert({
          id,
          user_id: userId,
          active_entry_id: entryId,
          updated_at: Date.now(),
        }, { onConflict: 'id' });

      if (error) {
        console.error('Failed to save active entry:', error);
        throw error;
      }
    },

    // Goal operations
    async getGoals(): Promise<Goal[]> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await getUserId();
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch goals:', error);
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        text: row.text,
        tag: row.tag || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        done: row.done,
        doneAt: row.done_at,
      }));
    },

    async saveGoals(goals: Goal[]): Promise<void> {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const userId = await requireUserId();
      const rows = goals.map((goal) => ({
        id: goal.id,
        user_id: userId,
        text: goal.text,
        tag: goal.tag || null,
        done: goal.done,
        done_at: goal.doneAt,
        created_at: goal.createdAt,
        updated_at: goal.updatedAt,
      }));

      const { error } = await supabase
        .from('goals')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.error('Failed to save goals:', error);
        throw error;
      }
    },
  };
}

