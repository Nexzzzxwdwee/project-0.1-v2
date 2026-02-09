export type RankState = {
  rankKey: string;
  rankName: string;
  nextRankName: string | null;
  progressPct: number;
  currentThreshold: number;
  nextThreshold: number | null;
};

type RankDefinition = {
  key: string;
  name: string;
  threshold: number;
};

const RANKS: RankDefinition[] = [
  { key: 'recruit', name: 'Recruit', threshold: 0 },
  { key: 'operator', name: 'Operator', threshold: 100 },
  { key: 'advanced', name: 'Advanced', threshold: 250 },
  { key: 'elite', name: 'Elite', threshold: 500 },
  { key: 'monk', name: 'Monk', threshold: 1000 },
  { key: 'sorcerer_supreme', name: 'Sorcerer Supreme', threshold: 2000 },
];

export function computeRankFromXP(xp: number): RankState {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  const ranks = [...RANKS].sort((a, b) => a.threshold - b.threshold);

  let currentIndex = 0;
  for (let i = 0; i < ranks.length; i += 1) {
    if (safeXp >= ranks[i].threshold) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const current = ranks[currentIndex];
  const next = ranks[currentIndex + 1] || null;
  const currentThreshold = current.threshold;
  const nextThreshold = next ? next.threshold : null;
  const progressPct = nextThreshold
    ? Math.min(
        100,
        Math.max(0, ((safeXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
      )
    : 100;

  return {
    rankKey: current.key,
    rankName: current.name,
    nextRankName: next ? next.name : null,
    progressPct,
    currentThreshold,
    nextThreshold,
  };
}
