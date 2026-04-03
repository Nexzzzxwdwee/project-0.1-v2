'use client';

import { useRankData } from '@/hooks/useRankData';
import { RANK_TIERS } from '@/lib/ranks';
import styles from './rank.module.css';

const SHIELD_PATH =
  'M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z';

const LOCK_PATH =
  'M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z';

export default function RankPage() {
  const { userProgress, rankInfo, loading } = useRankData();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.gridBg}></div>
        <div className={styles.container}>
          <div className={styles.loadingState}>Loading rank data...</div>
        </div>
      </div>
    );
  }

  const totalXp = userProgress?.xp || 0;
  const currentStreak = userProgress?.currentStreak || 0;
  const bestStreak = userProgress?.bestStreak || 0;
  const currentIndex = rankInfo?.currentIndex ?? 0;
  const progressPercent = rankInfo?.progressPercent ?? 0;
  const currentTier = rankInfo?.current ?? RANK_TIERS[0];
  const nextTier = rankInfo?.next ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.gridBg}></div>

      <div className={styles.container}>
        {/* ─── Header ─── */}
        <header className={styles.header}>
          <h1 className={styles.title}>Rank Progression</h1>
          <p className={styles.subtitle}>
            <svg className={styles.subtitleIcon} viewBox="0 0 512 512" fill="currentColor">
              <path d={SHIELD_PATH} />
            </svg>
            <span>12 Rank Tiers</span>
          </p>
        </header>

        {/* ─── Current Rank Hero ─── */}
        <section
          className={styles.hero}
          style={{ '--rank-color': currentTier.color, '--rank-muted': currentTier.colorMuted } as React.CSSProperties}
        >
          <div className={styles.heroGlow}></div>

          <div className={styles.heroBadge}>
            <svg className={styles.heroShield} viewBox="0 0 512 512" fill="currentColor">
              <path d={SHIELD_PATH} />
            </svg>
          </div>

          <div className={styles.heroBody}>
            <span className={styles.heroLabel}>Current Rank</span>
            <h2 className={styles.heroRankName}>{currentTier.name}</h2>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{totalXp.toLocaleString()}</span>
                <span className={styles.heroStatLabel}>Total XP</span>
              </div>
              <div className={styles.heroStatDivider}></div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>
                  {currentStreak > 0 && <span className={styles.streakFire}>&#x1F525;</span>}
                  {currentStreak}
                </span>
                <span className={styles.heroStatLabel}>Streak</span>
              </div>
              <div className={styles.heroStatDivider}></div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{bestStreak}</span>
                <span className={styles.heroStatLabel}>Best</span>
              </div>
            </div>

            <div className={styles.heroProgress}>
              <div className={styles.heroProgressHeader}>
                <span>Progress to {nextTier ? nextTier.name : 'Max'}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className={styles.heroProgressTrack}>
                <div
                  className={styles.heroProgressFill}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className={styles.heroProgressFooter}>
                <span>{totalXp.toLocaleString()} XP</span>
                <span>{nextTier ? nextTier.xpRequired.toLocaleString() + ' XP' : 'MAX RANK'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Tier Grid ─── */}
        <section className={styles.tiersSection}>
          <div className={styles.tiersHeader}>
            <h2 className={styles.tiersTitle}>All Ranks</h2>
          </div>

          <div className={styles.tiersGrid}>
            {RANK_TIERS.map((tier, i) => {
              const isUnlocked = i <= currentIndex;
              const isCurrent = i === currentIndex;
              const isNext = i === currentIndex + 1;

              // Progress within this specific tier
              let tierProgress = 0;
              if (i < currentIndex) {
                tierProgress = 100;
              } else if (isCurrent) {
                tierProgress = progressPercent;
              }

              return (
                <div
                  key={tier.name}
                  className={`${styles.tierCard} ${isCurrent ? styles.tierCardCurrent : ''} ${!isUnlocked ? styles.tierCardLocked : ''}`}
                  style={{ '--tier-color': tier.color, '--tier-muted': tier.colorMuted } as React.CSSProperties}
                >
                  {isCurrent && <div className={styles.tierCardGlow}></div>}

                  <div className={styles.tierCardHeader}>
                    <div>
                      <div className={styles.tierCardLabelRow}>
                        <span className={styles.tierCardIndex}>Rank {i + 1}</span>
                        {isCurrent && <span className={styles.tierCardBadge}>CURRENT</span>}
                        {isNext && <span className={styles.tierCardBadgeNext}>NEXT</span>}
                      </div>
                      <h3 className={styles.tierCardName}>{tier.name}</h3>
                    </div>
                    <div className={styles.tierCardIcon}>
                      <svg viewBox="0 0 512 512" fill="currentColor">
                        <path d={isUnlocked ? SHIELD_PATH : LOCK_PATH} />
                      </svg>
                    </div>
                  </div>

                  <div className={styles.tierCardReq}>
                    <span>{tier.xpRequired.toLocaleString()} XP required</span>
                  </div>

                  <div className={styles.tierCardBar}>
                    <div
                      className={styles.tierCardBarFill}
                      style={{ width: `${tierProgress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Footer ─── */}
        <div className={styles.footer}>
          <p>&ldquo;Rise through the ranks. Master your destiny.&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
