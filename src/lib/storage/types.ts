/**
 * Storage adapter interface
 * Abstracts localStorage and Supabase operations
 */

import type {
  Preset,
  PresetId,
  DayPlan,
  DaySummary,
  UserProgress,
} from '@/lib/presets';
import type { JournalEntry } from '@/lib/types';
import type { Goal } from '@/lib/types';
import type { TimeLog, TimeLogSlot } from '@/lib/types';

/**
 * Storage adapter interface
 * All methods are async to support Supabase
 */
export interface StorageAdapter {
  // Preset operations
  getPresets(): Promise<Record<PresetId, Preset>>;
  savePresets(presets: Record<PresetId, Preset>): Promise<void>;
  getActivePresetId(): Promise<PresetId | null>;
  setActivePresetId(presetId: PresetId): Promise<void>;

  // Day plan operations
  getDayPlan(date: string): Promise<DayPlan>;
  saveDayPlan(plan: DayPlan): Promise<void>;
  listDayPlanDates(prefix?: string): Promise<string[]>;
  getDayPlansByPresetId(presetId: PresetId): Promise<DayPlan[]>;

  // Day summary operations
  getDaySummary(date: string): Promise<DaySummary | null>;
  saveDaySummary(summary: DaySummary): Promise<void>;
  getAllSealedDaySummaries(): Promise<DaySummary[]>;

  // User progress operations
  getUserProgress(): Promise<UserProgress | null>;
  saveUserProgress(progress: UserProgress): Promise<void>;
  updateUserProgress(updater: (prev: UserProgress) => UserProgress): Promise<void>;

  // Journal operations
  getJournalEntries(): Promise<JournalEntry[]>;
  saveJournalEntries(entries: JournalEntry[]): Promise<void>;
  /** Upsert a single entry without rewriting the whole collection. */
  saveJournalEntry(entry: JournalEntry): Promise<void>;
  /** Permanently remove a single entry. */
  deleteJournalEntry(id: string): Promise<void>;
  getActiveEntryId(): Promise<string | null>;
  setActiveEntryId(id: string | null): Promise<void>;

  // Goal operations
  getGoals(): Promise<Goal[]>;
  saveGoals(goals: Goal[]): Promise<void>;

  // Time Tracker operations
  getTimeLog(date: string): Promise<TimeLog>;
  saveTimeLog(log: TimeLog): Promise<void>;
  /**
   * Set or clear a single hour slot without overwriting the rest of the day.
   * Pass `null` to delete the slot. Read-merge-write, so concurrent edits from
   * another view (e.g. /today vs the journal) don't clobber each other.
   */
  saveTimeLogSlot(date: string, slotKey: string, slot: TimeLogSlot | null): Promise<void>;
  /** Update only the interval / summary fields, preserving slots. */
  saveTimeLogMeta(
    date: string,
    meta: Partial<Pick<TimeLog, 'interval' | 'wins' | 'learnt' | 'tomorrow' | 'notes'>>,
  ): Promise<void>;
}


