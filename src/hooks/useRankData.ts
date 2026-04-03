'use client';

import { useState, useEffect } from 'react';
import { getUserProgress, createDefaultUserProgress, type UserProgress } from '@/lib/presets';
import { getRankInfo, RANK_TIERS, type RankInfo, type RankTier } from '@/lib/ranks';

export interface RankData {
  /** Raw user progress from storage (null while loading) */
  userProgress: UserProgress | null;
  /** Derived rank info — tiers, progress %, next rank (null while loading) */
  rankInfo: RankInfo | null;
  /** All rank tiers for display */
  tiers: RankTier[];
  /** True until initial load completes */
  loading: boolean;
  /** Re-fetch from storage (call after sealDay) */
  refresh: () => Promise<void>;
}

/**
 * Shared hook for rank data. Both /today and /rank import this.
 * Reads from the storage adapter via getUserProgress() — single source of truth.
 */
export function useRankData(): RankData {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const progress = await getUserProgress();
      setUserProgress(progress || createDefaultUserProgress());
    } catch (error) {
      console.error('[useRankData] Failed to load:', error);
      setUserProgress(createDefaultUserProgress());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    await load();
  };

  const rankInfo = userProgress ? getRankInfo(userProgress.xp) : null;

  return {
    userProgress,
    rankInfo,
    tiers: RANK_TIERS,
    loading,
    refresh,
  };
}
