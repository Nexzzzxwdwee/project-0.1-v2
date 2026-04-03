/**
 * Rank definitions and progression logic.
 * Single source of truth for all rank thresholds.
 */

export interface RankTier {
  name: string;
  xpRequired: number;
  color: string;       // Primary accent color
  colorMuted: string;  // Dimmed variant for backgrounds/borders
}

/**
 * All rank tiers in ascending order.
 * XP thresholds are cumulative — a user with 2500 XP is Specialist.
 */
export const RANK_TIERS: RankTier[] = [
  { name: 'Recruit',    xpRequired: 0,      color: '#a8a29e', colorMuted: '#44403c' },
  { name: 'Operator',   xpRequired: 1000,   color: '#eab308', colorMuted: '#854d0e' },
  { name: 'Specialist',  xpRequired: 2500,   color: '#a78bfa', colorMuted: '#5b21b6' },
  { name: 'Tactician',  xpRequired: 5000,   color: '#3b82f6', colorMuted: '#1e40af' },
  { name: 'Sentinel',   xpRequired: 10000,  color: '#06b6d4', colorMuted: '#155e75' },
  { name: 'Vanguard',   xpRequired: 18000,  color: '#10b981', colorMuted: '#065f46' },
  { name: 'Warden',     xpRequired: 30000,  color: '#f97316', colorMuted: '#9a3412' },
  { name: 'Phantom',    xpRequired: 50000,  color: '#ec4899', colorMuted: '#9d174d' },
  { name: 'Architect',  xpRequired: 80000,  color: '#f43f5e', colorMuted: '#9f1239' },
  { name: 'Sovereign',  xpRequired: 120000, color: '#fbbf24', colorMuted: '#92400e' },
  { name: 'Apex',       xpRequired: 175000, color: '#e2e8f0', colorMuted: '#475569' },
  { name: 'Mythic',     xpRequired: 250000, color: '#fef08a', colorMuted: '#a16207' },
];

export interface RankInfo {
  current: RankTier;
  currentIndex: number;
  next: RankTier | null;
  xpIntoCurrentRank: number;   // XP earned past current rank threshold
  xpForCurrentTier: number;    // Total XP span of current tier (0 if max rank)
  progressPercent: number;     // 0-100 within current tier
}

/**
 * Derive rank info from total XP.
 * Returns current tier, next tier, and progress within the current tier.
 */
export function getRankInfo(totalXp: number): RankInfo {
  let currentIndex = 0;

  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= RANK_TIERS[i].xpRequired) {
      currentIndex = i;
      break;
    }
  }

  const current = RANK_TIERS[currentIndex];
  const next = currentIndex < RANK_TIERS.length - 1
    ? RANK_TIERS[currentIndex + 1]
    : null;

  const xpIntoCurrentRank = totalXp - current.xpRequired;
  const xpForCurrentTier = next
    ? next.xpRequired - current.xpRequired
    : 0;

  const progressPercent = xpForCurrentTier > 0
    ? Math.min(100, Math.round((xpIntoCurrentRank / xpForCurrentTier) * 100))
    : 100; // Max rank

  return {
    current,
    currentIndex,
    next,
    xpIntoCurrentRank,
    xpForCurrentTier,
    progressPercent,
  };
}

/**
 * Compute the updated rank and xpToNext for a given total XP.
 * Used by sealDay() to promote rank when XP thresholds are crossed.
 */
export function computeRankFields(totalXp: number): { rank: string; xpToNext: number } {
  const info = getRankInfo(totalXp);
  return {
    rank: info.current.name,
    xpToNext: info.next
      ? info.next.xpRequired - totalXp
      : 0,
  };
}
