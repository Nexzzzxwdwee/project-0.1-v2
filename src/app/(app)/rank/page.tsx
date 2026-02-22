'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getUserProgress, type UserProgress } from '@/lib/presets';
import { computeRankFromXP, RANK_DEFS } from '@/lib/rank/rankEngine';
import styles from './rank.module.css';
import { onAuthReady } from '@/lib/supabase/browser';

export default function RankPage() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  const loadData = useCallback(async () => {
    try {
      // READ ONLY: Only read from storage, never write
      const progress = await getUserProgress();
      setUserProgress(progress);
    } catch (error) {
      console.error('Failed to load rank data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = onAuthReady(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  const rankState = useMemo(() => computeRankFromXP(userProgress?.xp ?? 0), [userProgress?.xp]);
  const xpToNext = rankState.nextThreshold
    ? Math.max(rankState.nextThreshold - (userProgress?.xp ?? 0), 0)
    : 0;
  const progressPercent = rankState.progressPct;
  const currentRankName = rankState.rankName;
  const currentRankKey = rankState.rankKey;
  const currentRankIndex = RANK_DEFS.findIndex((rank) => rank.key === currentRankKey);

  const rankDescriptions: Record<string, string> = {
    recruit: 'Entry level. Foundation building phase.',
    operator: 'Disciplined execution. Systems online.',
    advanced: 'Advanced operator. Consistent delivery.',
    elite: 'Elite performer. Momentum unlocked.',
    monk: 'High focus. Mastery emerging.',
    sorcerer_supreme: 'Legendary discipline. Peak execution.',
  };

  const rankColors: Record<string, string> = {
    recruit: '#eab308',
    operator: '#d4af37',
    advanced: '#a855f7',
    elite: '#22c55e',
    monk: '#38bdf8',
    sorcerer_supreme: '#f97316',
  };

  // Default values for empty state
  const displayData: UserProgress = userProgress || {
    rankKey: rankState.rankKey,
    xp: 0,
    xpToNext,
    bestStreak: 0,
    currentStreak: 0,
    lastSealedDate: null,
    updatedAt: Date.now(),
  };

  const isEmpty = !userProgress;

  return (
    <div className={styles.page}>
      {/* Background Grid Effect */}
      <div className={styles.gridBackground}></div>

      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Rank Progression</h1>
            <div className={styles.subtitle}>
              <i className={styles.icon} aria-hidden="true">
                <svg
                  className={styles.iconSvg}
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="currentColor"
                    d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0z"
                  />
                </svg>
              </i>
              <span className={styles.subtitleText}>Complete Rank System</span>
            </div>
          </div>
        </header>

        {/* Current Rank Card */}
        <section className={styles.currentRankSection}>
          <div className={styles.currentRankCard}>
            <div className={styles.currentRankHeader}>
              <div>
                <div className={styles.rankLabelRow}>
                  <span className={styles.rankLabel}>Current Rank</span>
                  <span className={styles.currentBadge}>CURRENT</span>
                </div>
                <h2 className={styles.rankName}>{currentRankName}</h2>
              </div>
              <div className={styles.rankIcon}>
                <svg
                  className={styles.rankIconSvg}
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="currentColor"
                    d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z"
                  />
                </svg>
              </div>
            </div>

            {isEmpty && (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>
                  No rank data yet. Seal your first day to begin.
                </p>
              </div>
            )}

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>XP</div>
                <div className={styles.statValue}>{displayData.xp.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>XP to Next</div>
                <div className={styles.statValue}>{xpToNext.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Current Streak</div>
                <div className={styles.statValue}>{displayData.currentStreak}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Best Streak</div>
                <div className={styles.statValue}>{displayData.bestStreak}</div>
              </div>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Progress to Next Rank</span>
                <span className={styles.progressValue}>
                  {displayData.xp.toLocaleString()} /{' '}
                  {(rankState.nextThreshold ?? displayData.xp).toLocaleString()} XP
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Rank Tiers Grid */}
        <section className={styles.ranksSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Rank Tiers</h2>
            <span className={styles.sectionBadge}>{RANK_DEFS.length} Total Ranks</span>
          </div>

          <div className={styles.ranksGrid}>
            {RANK_DEFS.map((rank, index) => {
              const isCurrent = currentRankKey === rank.key;
              const isUnlocked = index < currentRankIndex;
              const fillPercent = isCurrent ? progressPercent : isUnlocked ? 100 : 0;
              const color = rankColors[rank.key] || '#a8a29e';
              const description = rankDescriptions[rank.key] || 'Progression milestone.';
              return (
                <div
                  key={rank.key}
                  className={`${styles.rankCard} ${isCurrent ? styles.rankCardCurrent : ''}`}
                >
                  <div className={styles.rankCardHeader}>
                    <div>
                      <div className={styles.rankCardLabelRow}>
                        <span className={styles.rankCardLabel}>Rank {index + 1}</span>
                        {isCurrent && (
                          <span className={styles.rankCardCurrentBadge}>CURRENT</span>
                        )}
                      </div>
                      <h3 className={styles.rankCardTitle}>{rank.name}</h3>
                    </div>
                    <div className={styles.rankCardIcon} style={{ color }}>
                      <svg
                        className={styles.rankCardIconSvg}
                        aria-hidden="true"
                        focusable="false"
                        viewBox="0 0 512 512"
                      >
                        <path
                          fill="currentColor"
                          d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className={styles.rankCardDescription}>{description}</p>
                  <div className={styles.rankCardProgress}>
                    <div className={styles.rankCardProgressHeader}>
                      <span className={styles.rankCardProgressLabel}>Requirement</span>
                      <span className={styles.rankCardProgressValue} style={{ color }}>
                        {rank.threshold.toLocaleString()} XP
                      </span>
                    </div>
                    <div className={styles.rankCardProgressBar}>
                      <div
                        className={styles.rankCardProgressFill}
                        style={{
                          width: `${fillPercent}%`,
                          backgroundColor: color,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            &ldquo;Rise through the ranks. Master your destiny.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
