'use client';

import { useState, useEffect } from 'react';
import { getUserProgress, type UserProgress } from '@/lib/presets';
import styles from './rank.module.css';

export default function RankPage() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // READ ONLY: Only read from storage, never write
        const progress = await getUserProgress();
        setUserProgress(progress);
      } catch (error) {
        console.error('Failed to load rank data:', error);
      }
    };
    loadData();
  }, []);

  // Calculate progress bar percentage (VIEW ONLY, not stored)
  const calculateProgressPercent = (): number => {
    if (!userProgress) return 0;
    const total = userProgress.xp + userProgress.xpToNext;
    if (total === 0) return 0;
    return (userProgress.xp / total) * 100;
  };

  const progressPercent = calculateProgressPercent();

  // Default values for empty state
  const displayData = userProgress || {
    rank: 'Recruit',
    xp: 0,
    xpToNext: 1000,
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
                <h2 className={styles.rankName}>{displayData.rank}</h2>
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
                <div className={styles.statValue}>
                  {displayData.xpToNext.toLocaleString()}
                </div>
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
                  {(displayData.xp + displayData.xpToNext).toLocaleString()} XP
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
            <span className={styles.sectionBadge}>12 Total Ranks</span>
          </div>

          <div className={styles.ranksGrid}>
            {/* Rank 1: Recruit */}
            <div
              className={`${styles.rankCard} ${
                displayData.rank === 'Recruit' ? styles.rankCardCurrent : ''
              }`}
            >
              <div className={styles.rankCardHeader}>
                <div>
                  <div className={styles.rankCardLabelRow}>
                    <span className={styles.rankCardLabel}>Rank 1</span>
                    {displayData.rank === 'Recruit' && (
                      <span className={styles.rankCardCurrentBadge}>CURRENT</span>
                    )}
                  </div>
                  <h3 className={styles.rankCardTitle}>Recruit</h3>
                </div>
                <div className={styles.rankCardIcon} style={{ color: '#eab308' }}>
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
              <p className={styles.rankCardDescription}>
                Entry level. Foundation building phase.
              </p>
              <div className={styles.rankCardProgress}>
                <div className={styles.rankCardProgressHeader}>
                  <span className={styles.rankCardProgressLabel}>Requirement</span>
                  <span className={styles.rankCardProgressValue} style={{ color: '#eab308' }}>
                    0 XP
                  </span>
                </div>
                <div className={styles.rankCardProgressBar}>
                  <div
                    className={styles.rankCardProgressFill}
                    style={{
                      width: displayData.rank === 'Recruit' ? `${progressPercent}%` : '0%',
                      backgroundColor: '#eab308',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Rank 2: Operator */}
            <div
              className={`${styles.rankCard} ${
                displayData.rank === 'Operator' ? styles.rankCardCurrent : ''
              }`}
            >
              <div className={styles.rankCardHeader}>
                <div>
                  <div className={styles.rankCardLabelRow}>
                    <span className={styles.rankCardLabel}>Rank 2</span>
                    {displayData.rank === 'Operator' && (
                      <span className={styles.rankCardCurrentBadge}>CURRENT</span>
                    )}
                  </div>
                  <h3 className={styles.rankCardTitle}>Operator</h3>
                </div>
                <div className={styles.rankCardIcon} style={{ color: '#d4af37' }}>
                  <svg
                    className={styles.rankCardIconSvg}
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
                    />
                  </svg>
                </div>
              </div>
              <p className={styles.rankCardDescription}>
                Skilled practitioner. Advanced operations unlocked.
              </p>
              <div className={styles.rankCardProgress}>
                <div className={styles.rankCardProgressHeader}>
                  <span className={styles.rankCardProgressLabel}>Requirement</span>
                  <span className={styles.rankCardProgressValue} style={{ color: '#d4af37' }}>
                    1000 XP
                  </span>
                </div>
                <div className={styles.rankCardProgressBar}>
                  <div
                    className={styles.rankCardProgressFill}
                    style={{
                      width: '0%',
                      backgroundColor: '#d4af37',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Additional ranks would go here - showing a few more for structure */}
            {/* Rank 3: Specialist */}
            <div className={styles.rankCard}>
              <div className={styles.rankCardHeader}>
                <div>
                  <div className={styles.rankCardLabelRow}>
                    <span className={styles.rankCardLabel}>Rank 3</span>
                  </div>
                  <h3 className={styles.rankCardTitle}>Specialist</h3>
                </div>
                <div className={styles.rankCardIcon} style={{ color: '#b19cd9' }}>
                  <svg
                    className={styles.rankCardIconSvg}
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 576 512"
                  >
                    <path
                      fill="currentColor"
                      d="M234.7 42.7L197 56.8c-3 1.1-5 4-5 7.2s2 6.1 5 7.2l37.7 14.1L248.8 123c1.1 3 4 5 7.2 5s6.1-2 7.2-5l14.1-37.7L315 71.2c3-1.1 5-4 5-7.2s-2-6.1-5-7.2L277.3 42.7 263.2 5c-1.1-3-4-5-7.2-5s-6.1 2-7.2 5L234.7 42.7zM46.1 395.4c-18.7 18.7-18.7 49.1 0 67.9l34.6 34.6c18.7 18.7 49.1 18.7 67.9 0L529.9 116.5c18.7-18.7 18.7-49.1 0-67.9L495.3 14.1c-18.7-18.7-49.1-18.7-67.9 0L46.1 395.4zM484.6 82.6l-105 105-23.3-23.3 105-105 23.3 23.3zM7.5 117.2C3 118.9 0 123.2 0 128s3 9.1 7.5 10.8L64 160l21.2 56.5c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L128 160l56.5-21.2c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L128 96 106.8 39.5C105.1 35 100.8 32 96 32s-9.1 3-10.8 7.5L64 96 7.5 117.2zm352 256c-4.5 1.7-7.5 6-7.5 10.8s3 9.1 7.5 10.8L416 416l21.2 56.5c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L480 416l56.5-21.2c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L480 352l-21.2-56.5c-1.7-4.5-6-7.5-10.8-7.5s-9.1 3-10.8 7.5L416 352l-56.5 21.2z"
                    />
                  </svg>
                </div>
              </div>
              <p className={styles.rankCardDescription}>
                Expert level. Mastery in specific domains.
              </p>
              <div className={styles.rankCardProgress}>
                <div className={styles.rankCardProgressHeader}>
                  <span className={styles.rankCardProgressLabel}>Requirement</span>
                  <span className={styles.rankCardProgressValue} style={{ color: '#b19cd9' }}>
                    2500 XP
                  </span>
                </div>
                <div className={styles.rankCardProgressBar}>
                  <div
                    className={styles.rankCardProgressFill}
                    style={{
                      width: '0%',
                      backgroundColor: '#b19cd9',
                    }}
                  ></div>
                </div>
              </div>
            </div>
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
