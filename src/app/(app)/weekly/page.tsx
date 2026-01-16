'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllSealedDaySummaries, getUserProgress, type DaySummary, type DayStatus } from '@/lib/presets';
import styles from './weekly.module.css';

interface DayData {
  day: string;
  date: string; // YYYY-MM-DD
  dateNumber: number;
  status: DayStatus | 'INCOMPLETE';
  points: number;
  isToday: boolean;
  summary: DaySummary | null;
}

/**
 * Get Monday of the week for a given date (UK standard - week starts Monday)
 */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get all dates in a week (Monday to Sunday)
 */
function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const monday = getMondayOfWeek(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format week range for display (e.g., "Jan 5 – Jan 11, 2025")
 */
function formatWeekRange(weekDates: Date[]): string {
  const start = weekDates[0];
  const end = weekDates[6];
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = start.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Get status label from DayStatus
 */
function getStatusLabel(status: DayStatus | 'INCOMPLETE'): string {
  switch (status) {
    case 'Building':
      return 'BUILDING';
    case 'Strong':
      return 'STRONG';
    case 'Elite':
      return 'ELITE';
    case 'Unbroken':
      return 'UNBROKEN';
    case 'INCOMPLETE':
      return 'INCOMPLETE';
    default:
      return 'BUILDING';
  }
}

export default function WeeklyPage() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [sealedSummaries, setSealedSummaries] = useState<DaySummary[]>([]);
  const [userProgress, setUserProgress] = useState<ReturnType<typeof getUserProgress>>(null);

  useEffect(() => {
    // READ ONLY: Only read from localStorage, never write
    const summaries = getAllSealedDaySummaries();
    setSealedSummaries(summaries);
    
    const progress = getUserProgress();
    setUserProgress(progress);
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekRangeText = useMemo(() => formatWeekRange(weekDates), [weekDates]);

  // Filter summaries for current week
  const weekSummaries = useMemo(() => {
    const weekKeys = weekDates.map(formatDateKey);
    const summaryMap = new Map<string, DaySummary>();
    
    sealedSummaries.forEach((summary) => {
      if (weekKeys.includes(summary.date)) {
        summaryMap.set(summary.date, summary);
      }
    });
    
    return summaryMap;
  }, [sealedSummaries, weekDates]);

  // Process week days data
  const weekData: DayData[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return weekDates.map((date, index) => {
      const dateKey = formatDateKey(date);
      const summary = weekSummaries.get(dateKey) || null;
      
      return {
        day: days[index],
        date: dateKey,
        dateNumber: date.getDate(),
        status: summary?.status || 'INCOMPLETE',
        points: summary?.totalScorePct || 0,
        isToday: isToday(date),
        summary,
      };
    });
  }, [weekDates, weekSummaries]);

  // Calculate summary stats
  const summaryData = useMemo(() => {
    const completedDays = weekData.filter((d) => d.summary !== null).length;
    
    const weekSummariesArray = Array.from(weekSummaries.values());
    const avgScore =
      weekSummariesArray.length > 0
        ? Math.round(
            weekSummariesArray.reduce((sum, s) => sum + s.totalScorePct, 0) /
              weekSummariesArray.length
          )
        : 0;
    
    const bestStreak = userProgress?.bestStreak || 0;
    
    return {
      daysCompleted: completedDays,
      totalDays: 7,
      weeklyAvgScore: avgScore,
      bestStreak,
    };
  }, [weekData, weekSummaries, userProgress]);

  const handlePreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const isEmpty = sealedSummaries.length === 0;

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
          <button
            type="button"
            className={styles.weekSelectorButton}
            onClick={handlePreviousWeek}
            aria-label="Previous week"
          >
            <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
              <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
            </svg>
          </button>
          <div className={styles.weekSelectorDisplay}>
            <span className={styles.weekSelectorText}>{weekRangeText}</span>
          </div>
          <button
            type="button"
            className={styles.weekSelectorButton}
            onClick={handleNextWeek}
            aria-label="Next week"
          >
            <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
              <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Empty State */}
      {isEmpty && (
        <section className={styles.emptyStateSection}>
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>
              No sealed days yet. Seal your first day to populate Weekly.
            </p>
          </div>
        </section>
      )}

      {!isEmpty && (
        <>
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
                {summaryData.bestStreak > 0 && (
                  <div className={styles.streakBadge}>
                    <svg className={styles.fireIcon} viewBox="0 0 384 512" fill="currentColor">
                      <path d="M153.6 29.9l16-21.3C173.6 3.2 180 0 186.7 0C198.4 0 208 9.6 208 21.3V43.5c0 8.7 3.5 17 9.7 23.1L278.4 96l-9.5 7.6c-2.1 1.7-3.3 4.2-3.3 6.9v64c0 5.5 4.5 10 10 10h80c5.5 0 10-4.5 10-10v-64c0-2.7-1.2-5.2-3.3-6.9l-9.5-7.6L350.3 66.6c6.2-6.1 9.7-14.4 9.7-23.1V21.3C360 9.6 369.6 0 381.3 0c6.7 0 13.1 3.2 17.1 8.6l16 21.3c6 8 9.4 17.5 9.4 27.1V384c0 70.7-57.3 128-128 128H128C57.3 512 0 454.7 0 384V57.7c0-9.6 3.4-19.1 9.4-27.1l16-21.3C29.5 3.2 35.9 0 42.7 0C54.4 0 64 9.6 64 21.3V43.5c0 8.7 3.5 17 9.7 23.1L134.4 96l-9.5 7.6c-2.1 1.7-3.3 4.2-3.3 6.9v64c0 5.5 4.5 10 10 10h80c5.5 0 10-4.5 10-10v-64c0-2.7-1.2-5.2-3.3-6.9l-9.5-7.6L153.6 29.9z" />
                    </svg>
                    <span className={styles.streakBadgeText}>Unbroken</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Week View */}
          <section className={styles.weekViewSection}>
            <h2 className={styles.sectionTitle}>Week at a Glance</h2>
            <div className={styles.weekGrid}>
              {weekData.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  className={`${styles.dayCard} ${day.isToday ? styles.dayCardToday : ''}`}
                >
                  <span className={styles.dayLabel}>{day.day}</span>
                  <span className={`${styles.dayDate} ${day.isToday ? styles.dayDateToday : ''}`}>
                    {day.dateNumber}
                  </span>
                  <div
                    className={`${styles.dayStatusIcon} ${
                      day.status === 'INCOMPLETE'
                        ? styles.dayStatusIconIncomplete
                        : styles.dayStatusIconComplete
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
                      day.status === 'INCOMPLETE'
                        ? styles.dayStatusTextIncomplete
                        : styles.dayStatusTextComplete
                    }`}
                  >
                    {getStatusLabel(day.status)}
                  </span>
                  <span className={`${styles.dayPoints} ${day.isToday ? styles.dayPointsToday : ''}`}>
                    {day.points} pts
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Footer Quote */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Consistency compounds.&quot;</p>
      </div>
    </div>
  );
}
