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
import type { JournalEntry } from '@/app/(app)/journal/page';
import type { Goal } from '@/app/(app)/goals/page';

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
  getActiveEntryId(): Promise<string | null>;
  setActiveEntryId(id: string | null): Promise<void>;

  // Goal operations
  getGoals(): Promise<Goal[]>;
  saveGoals(goals: Goal[]): Promise<void>;
}


