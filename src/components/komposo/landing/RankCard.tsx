import styles from './landing.module.css';

export function RankCard() {
  return (
    <div className={styles.rankCardWrapper}>
      <div className={styles.rankCardGlow}></div>
      <div className={`${styles.glassCard} ${styles.rankCard} ${styles.animateFloat}`}>
        <div className={styles.rankCardInner}>
          <div className={styles.scanLine}></div>
        </div>
        
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardStatus}>Current Status</p>
            <h3 className={styles.cardTitle}>
              OPERATOR
              <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
              </svg>
            </h3>
          </div>
          <div className={styles.crownIcon}>
            <svg className={styles.icon} viewBox="0 0 576 512" fill="currentColor">
              <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
            </svg>
          </div>
        </div>

        <div className={styles.cardStats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>XP Progress</span>
            <span className={styles.statValue}>1,240 / 1,500</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
          <div className={styles.statBadges}>
            <div className={styles.statBadge}>🔥 12 Day Streak</div>
            <div className={styles.statBadge}>✅ 94% Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  );
}

