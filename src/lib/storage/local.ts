/**
 * localStorage adapter implementation
 * Wraps existing localStorage helpers
 */

import { P01_PREFIX, getJSON, setJSON, listKeys } from '@/lib/p01Storage';
import type {
  Preset,
  PresetId,
  DayPlan,
  DaySummary,
  UserProgress,
} from '@/lib/presets';
import { computeRankFromXP } from '@/lib/rank/rankEngine';
import type { StorageAdapter, Transaction } from './types';
import type { JournalEntry } from '@/app/(app)/journal/page';
import type { Goal } from '@/app/(app)/goals/page';

/**
 * localStorage adapter implementation
 * All methods are async for interface compatibility
 */
export function localStorageAdapter(): StorageAdapter {
  const sortTransactions = (items: Transaction[]): Transaction[] => {
    return [...items].sort((a, b) => {
      if (a.date === b.date) {
        const aUpdated = a.updated_at ?? 0;
        const bUpdated = b.updated_at ?? 0;
        return bUpdated - aUpdated;
      }
      return a.date > b.date ? -1 : 1;
    });
  };

  return {
    // Preset operations
    async getPresets(): Promise<Record<PresetId, Preset>> {
      return getJSON<Record<PresetId, Preset>>(`${P01_PREFIX}presets`, {});
    },

    async savePresets(presets: Record<PresetId, Preset>): Promise<void> {
      setJSON(`${P01_PREFIX}presets`, presets);
    },

    async getActivePresetId(): Promise<PresetId | null> {
      return getJSON<PresetId | null>(`${P01_PREFIX}activePresetId`, null);
    },

    async setActivePresetId(presetId: PresetId): Promise<void> {
      setJSON(`${P01_PREFIX}activePresetId`, presetId);
    },

    // Day plan operations
    async getDayPlan(date: string): Promise<DayPlan> {
      return getJSON<DayPlan>(
        `${P01_PREFIX}dayplan:${date}`,
        {
          date,
          activePresetId: null,
          presetUpdatedAt: null,
          items: [],
          archived: [],
          isSealed: false,
        }
      );
    },

    async saveDayPlan(plan: DayPlan): Promise<void> {
      setJSON(`${P01_PREFIX}dayplan:${plan.date}`, plan);
    },

    async listDayPlanDates(prefix: string = `${P01_PREFIX}dayplan:`): Promise<string[]> {
      const keys = listKeys(prefix);
      return keys.map((key) => {
        // Extract date from key: "p01:dayplan:2025-01-15" -> "2025-01-15"
        const datePart = key.replace(prefix, '');
        return datePart;
      });
    },

    // Day summary operations
    async getDaySummary(date: string): Promise<DaySummary | null> {
      return getJSON<DaySummary | null>(`${P01_PREFIX}daySummary:${date}`, null);
    },

    async saveDaySummary(summary: DaySummary): Promise<void> {
      setJSON(`${P01_PREFIX}daySummary:${summary.date}`, summary);
    },

    async getAllSealedDaySummaries(): Promise<DaySummary[]> {
      if (typeof window === 'undefined') return [];
      
      const summaryKeys = listKeys(`${P01_PREFIX}daySummary:`);
      const summaries: DaySummary[] = [];
      
      for (const key of summaryKeys) {
        try {
          const summary = getJSON<DaySummary | null>(key, null);
          if (summary && summary.isSealed) {
            summaries.push(summary);
          }
        } catch (error) {
          console.warn(`Failed to parse daySummary key "${key}":`, error);
        }
      }
      
      summaries.sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return 0;
      });
      
      return summaries;
    },

    // User progress operations
    async getUserProgress(): Promise<UserProgress | null> {
      return getJSON<UserProgress | null>(`${P01_PREFIX}userProgress`, null);
    },

    async saveUserProgress(progress: UserProgress): Promise<void> {
      setJSON(`${P01_PREFIX}userProgress`, progress);
    },

    async updateUserProgress(updater: (prev: UserProgress) => UserProgress): Promise<void> {
      const current = await this.getUserProgress();
      if (!current) {
        const rankState = computeRankFromXP(0);
        const defaultProgress: UserProgress = {
          xp: 0,
          rankKey: rankState.rankKey,
          xpToNext: rankState.nextThreshold ? rankState.nextThreshold : 0,
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

    async setUserProgress(patch: Partial<UserProgress>): Promise<UserProgress> {
      let updated: UserProgress | null = null;
      await this.updateUserProgress((prev) => {
        updated = {
          ...prev,
          ...patch,
          updatedAt: patch.updatedAt ?? Date.now(),
        };
        return updated;
      });

      if (!updated) {
        throw new Error('Failed to update user progress');
      }

      return updated;
    },

    // Journal operations
    async getJournalEntries(): Promise<JournalEntry[]> {
      if (typeof window === 'undefined') return [];
      return getJSON<JournalEntry[]>(`${P01_PREFIX}journalEntries`, []);
    },

    async saveJournalEntries(entries: JournalEntry[]): Promise<void> {
      if (typeof window === 'undefined') return;
      setJSON(`${P01_PREFIX}journalEntries`, entries);
    },

    async getActiveEntryId(): Promise<string | null> {
      if (typeof window === 'undefined') return null;
      return getJSON<string | null>(`${P01_PREFIX}journalActiveEntryId`, null);
    },

    async setActiveEntryId(id: string | null): Promise<void> {
      if (typeof window === 'undefined') return;
      setJSON(`${P01_PREFIX}journalActiveEntryId`, id);
    },

    // Goal operations
    async getGoals(): Promise<Goal[]> {
      if (typeof window === 'undefined') return [];
      return getJSON<Goal[]>(`${P01_PREFIX}goals`, []);
    },

    async saveGoals(goals: Goal[]): Promise<void> {
      if (typeof window === 'undefined') return;
      setJSON(`${P01_PREFIX}goals`, goals);
    },

    // Earnings operations
    async getTransactions(): Promise<Transaction[]> {
      if (typeof window === 'undefined') return [];
      const items = getJSON<Transaction[]>(`${P01_PREFIX}transactions`, []);
      return sortTransactions(items);
    },

    async saveTransactions(items: Transaction[]): Promise<void> {
      if (typeof window === 'undefined') return;
      setJSON(`${P01_PREFIX}transactions`, sortTransactions(items));
    },
  };
}


