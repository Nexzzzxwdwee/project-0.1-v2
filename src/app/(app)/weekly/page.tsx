'use client';

import styles from './weekly.module.css';

interface DayData {
  day: string;
  date: number;
  status: 'ELITE' | 'COMPLETE' | 'INCOMPLETE';
  points: number;
  isToday?: boolean;
}

const weekData: DayData[] = [
  { day: 'Mon', date: 5, status: 'ELITE', points: 890 },
  { day: 'Tue', date: 6, status: 'COMPLETE', points: 820 },
  { day: 'Wed', date: 7, status: 'ELITE', points: 875 },
  { day: 'Thu', date: 8, status: 'ELITE', points: 850, isToday: true },
  { day: 'Fri', date: 9, status: 'COMPLETE', points: 835 },
  { day: 'Sat', date: 10, status: 'INCOMPLETE', points: 0 },
  { day: 'Sun', date: 11, status: 'COMPLETE', points: 840 },
];

const summaryData = {
  daysCompleted: 6,
  totalDays: 7,
  weeklyAvgScore: 847,
  bestStreak: 12,
};

export default function WeeklyPage() {
  return (
    <div className={styles.page}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Weekly</h1>
          <p className={styles.subtitle}>Review consistency and trajectory across the week.</p>
        </div>

        {/* Week Selector */}
        <div className={styles.weekSelector}>
          <button type="button" className={styles.weekSelectorButton} aria-label="Previous week">
            <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
              <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
            </svg>
          </button>
          <div className={styles.weekSelectorDisplay}>
            <span className={styles.weekSelectorText}>Jan 5 – Jan 11, 2025</span>
          </div>
          <button type="button" className={styles.weekSelectorButton} aria-label="Next week">
            <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
              <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Weekly Summary */}
      <section className={styles.summarySection}>
        <div className={styles.summaryGrid}>
          {/* Days Completed */}
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Days Completed</span>
            <div className={styles.summaryValueRow}>
              <span className={styles.summaryValue}>{summaryData.daysCompleted}</span>
              <span className={styles.summaryValueSub}>/ {summaryData.totalDays}</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(summaryData.daysCompleted / summaryData.totalDays) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Weekly Average Score */}
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Weekly Avg Score</span>
            <div className={styles.summaryValueRow}>
              <span className={styles.summaryValue}>{summaryData.weeklyAvgScore}</span>
              <span className={styles.summaryValueSub}>pts</span>
            </div>
            <div className={styles.summaryNote}>Consistent execution</div>
          </div>

          {/* Best Streak */}
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Best Streak</span>
            <div className={styles.summaryValueRow}>
              <span className={styles.summaryValue}>{summaryData.bestStreak}</span>
              <span className={styles.summaryValueSub}>days</span>
            </div>
            <div className={styles.streakBadge}>
              <svg className={styles.fireIcon} viewBox="0 0 384 512" fill="currentColor">
                <path d="M153.6 29.9l16-21.3C173.6 3.2 180 0 186.7 0C198.4 0 208 9.6 208 21.3V43.5c0 8.7 3.5 17 9.7 23.1L278.4 96l-9.5 7.6c-2.1 1.7-3.3 4.2-3.3 6.9v64c0 5.5 4.5 10 10 10h80c5.5 0 10-4.5 10-10v-64c0-2.7-1.2-5.2-3.3-6.9l-9.5-7.6L350.3 66.6c6.2-6.1 9.7-14.4 9.7-23.1V21.3C360 9.6 369.6 0 381.3 0c6.7 0 13.1 3.2 17.1 8.6l16 21.3c6 8 9.4 17.5 9.4 27.1V384c0 70.7-57.3 128-128 128H128C57.3 512 0 454.7 0 384V57.7c0-9.6 3.4-19.1 9.4-27.1l16-21.3C29.5 3.2 35.9 0 42.7 0C54.4 0 64 9.6 64 21.3V43.5c0 8.7 3.5 17 9.7 23.1L134.4 96l-9.5 7.6c-2.1 1.7-3.3 4.2-3.3 6.9v64c0 5.5 4.5 10 10 10h80c5.5 0 10-4.5 10-10v-64c0-2.7-1.2-5.2-3.3-6.9l-9.5-7.6L153.6 29.9z" />
              </svg>
              <span className={styles.streakBadgeText}>Unbroken</span>
            </div>
          </div>
        </div>
      </section>

      {/* Week View */}
      <section className={styles.weekViewSection}>
        <h2 className={styles.sectionTitle}>Week at a Glance</h2>
        <div className={styles.weekGrid}>
          {weekData.map((day) => (
            <button
              key={day.day}
              type="button"
              className={`${styles.dayCard} ${day.isToday ? styles.dayCardToday : ''}`}
            >
              <span className={styles.dayLabel}>{day.day}</span>
              <span className={`${styles.dayDate} ${day.isToday ? styles.dayDateToday : ''}`}>
                {day.date}
              </span>
              <div
                className={`${styles.dayStatusIcon} ${
                  day.status === 'INCOMPLETE' ? styles.dayStatusIconIncomplete : styles.dayStatusIconComplete
                }`}
              >
                {day.status === 'INCOMPLETE' ? (
                  <svg className={styles.icon} viewBox="0 0 384 512" fill="currentColor">
                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                  </svg>
                ) : (
                  <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                    <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                  </svg>
                )}
              </div>
              <span
                className={`${styles.dayStatusText} ${
                  day.status === 'INCOMPLETE' ? styles.dayStatusTextIncomplete : styles.dayStatusTextComplete
                }`}
              >
                {day.status}
              </span>
              <span className={`${styles.dayPoints} ${day.isToday ? styles.dayPointsToday : ''}`}>
                {day.points} pts
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Patterns Section */}
      <section className={styles.patternsSection}>
        <h2 className={styles.sectionTitle}>Patterns</h2>
        <div className={styles.patternsCard}>
          <div className={styles.patternsList}>
            <div className={styles.patternItem}>
              <div className={`${styles.patternDot} ${styles.patternDotGreen}`}></div>
              <div>
                <p className={styles.patternTitle}>Most consistent on weekdays</p>
                <p className={styles.patternDescription}>
                  Mon–Fri averaged 854 pts. Weekend dip on Saturday.
                </p>
              </div>
            </div>
            <div className={styles.patternItem}>
              <div className={`${styles.patternDot} ${styles.patternDotYellow}`}></div>
              <div>
                <p className={styles.patternTitle}>Streak momentum is strong</p>
                <p className={styles.patternDescription}>
                  12-day unbroken streak. One missed day this week didn&apos;t break it.
                </p>
              </div>
            </div>
            <div className={styles.patternItem}>
              <div className={`${styles.patternDot} ${styles.patternDotGray}`}></div>
              <div>
                <p className={styles.patternTitle}>Execution is stable</p>
                <p className={styles.patternDescription}>
                  6 of 7 days completed. Consistency is the foundation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Quote */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Consistency compounds.&quot;</p>
      </div>
    </div>
  );
}
