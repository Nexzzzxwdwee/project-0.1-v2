'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllSealedDaySummaries, getUserProgress, type DaySummary, type DayStatus, type UserProgress } from '@/lib/presets';
import styles from './history.module.css';

// ── Types ───────────────────────────────────────────────────────

interface DayData {
  day: string;
  date: string; // YYYY-MM-DD
  dateNumber: number;
  status: DayStatus | 'INCOMPLETE';
  points: number;
  isToday: boolean;
  summary: DaySummary | null;
}

interface ProcessedEntry {
  id: string;
  date: string;
  formattedDate: string;
  habitsCount: number;
  tasksCount: number;
  habitsDone: number;
  tasksDone: number;
  status: DayStatus;
  score: number;
  isSealed: boolean;
}

type LogFilter = 'ALL' | 'THIS_WEEK' | 'THIS_MONTH';

// ── Helpers ─────────────────────────────────────────────────────

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

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

function isTodayDate(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getStatusLabel(status: DayStatus | 'INCOMPLETE'): string {
  switch (status) {
    case 'Building': return 'BUILDING';
    case 'Strong': return 'STRONG';
    case 'Elite': return 'ELITE';
    case 'Unbroken': return 'UNBROKEN';
    case 'INCOMPLETE': return 'INCOMPLETE';
    default: return 'BUILDING';
  }
}

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function processSummary(summary: DaySummary): ProcessedEntry {
  return {
    id: summary.date,
    date: summary.date,
    formattedDate: formatEntryDate(summary.date),
    habitsCount: summary.habitsTotal || 0,
    tasksCount: summary.tasksTotal || 0,
    habitsDone: summary.habitsDone || 0,
    tasksDone: summary.tasksDone || 0,
    status: summary.status,
    score: summary.totalScorePct / 10,
    isSealed: summary.isSealed,
  };
}

function calculateAvgDailyScore(summaries: DaySummary[]): number {
  if (summaries.length === 0) return 0;
  const recent = summaries.slice(0, 7);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, s) => sum + s.totalScorePct / 10, 0);
  return Math.round((total / recent.length) * 10) / 10;
}

function calculateCompletionRate(summaries: DaySummary[]): number {
  if (summaries.length === 0) return 0;
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const recent = summaries.filter((s) => {
    const d = new Date(s.date + 'T00:00:00');
    return d >= thirtyDaysAgo && d <= today;
  });
  return Math.min(100, Math.max(0, Math.round((recent.length / 30) * 100)));
}

function countLast30DaysSealed(summaries: DaySummary[]): number {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return summaries.filter((s) => {
    const d = new Date(s.date + 'T00:00:00');
    return d >= thirtyDaysAgo && d <= today;
  }).length;
}

// ── Component ───────────────────────────────────────────────────

export default function HistoryPage() {
  const [sealedSummaries, setSealedSummaries] = useState<DaySummary[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<LogFilter>('ALL');

  useEffect(() => {
    const loadData = async () => {
      try {
        const summaries = await getAllSealedDaySummaries();
        setSealedSummaries(summaries);
        const progress = await getUserProgress();
        setUserProgress(progress);
      } catch (error) {
        console.error('Failed to load history data:', error);
      }
    };
    loadData();
  }, []);

  // ── Summary map for quick lookup ──
  const summaryMap = useMemo(() => {
    const map = new Map<string, DaySummary>();
    sealedSummaries.forEach((s) => map.set(s.date, s));
    return map;
  }, [sealedSummaries]);

  // ── SECTION 1: Top Stats ──
  const topStats = useMemo(() => {
    const last30Sealed = countLast30DaysSealed(sealedSummaries);
    return {
      currentStreak: userProgress?.currentStreak || 0,
      bestStreak: userProgress?.bestStreak || 0,
      completionRate: calculateCompletionRate(sealedSummaries),
      avgDailyScore: calculateAvgDailyScore(sealedSummaries),
      daysTracked: sealedSummaries.length,
      daysMissed: 30 - last30Sealed,
    };
  }, [sealedSummaries, userProgress]);

  // ── SECTION 2: Week at a Glance ──
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekRangeText = useMemo(() => formatWeekRange(weekDates), [weekDates]);

  const weekData: DayData[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return weekDates.map((date, index) => {
      const dateKey = formatDateKey(date);
      const summary = summaryMap.get(dateKey) || null;
      return {
        day: days[index],
        date: dateKey,
        dateNumber: date.getDate(),
        status: summary?.status || 'INCOMPLETE',
        points: summary?.totalScorePct || 0,
        isToday: isTodayDate(date),
        summary,
      };
    });
  }, [weekDates, summaryMap]);

  const weekSummaryStats = useMemo(() => {
    const completedDays = weekData.filter((d) => d.summary !== null).length;
    const weekSummariesArr = weekData.filter((d) => d.summary !== null).map((d) => d.summary!);
    const avgScore = weekSummariesArr.length > 0
      ? Math.round(weekSummariesArr.reduce((sum, s) => sum + s.totalScorePct, 0) / weekSummariesArr.length)
      : 0;
    return {
      daysCompleted: completedDays,
      weeklyAvgScore: avgScore,
      bestStreak: userProgress?.bestStreak || 0,
    };
  }, [weekData, userProgress]);

  // ── SECTION 3: Heatmap ──
  const heatmapData = useMemo(() => {
    const today = new Date();
    const cells: { date: string; score: number; hasData: boolean }[] = [];
    // 12 weeks = 84 days. Start from 83 days ago.
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const summary = summaryMap.get(key);
      cells.push({
        date: key,
        score: summary?.totalScorePct || 0,
        hasData: !!summary,
      });
    }
    // Organize into weeks (columns). Each column = 7 days (Mon-Sun).
    // First, find the day-of-week of the oldest date to align rows.
    const oldest = new Date(today);
    oldest.setDate(today.getDate() - 83);
    // Get day of week (0=Sun, adjust so Mon=0)
    const oldestDow = (oldest.getDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6

    // Pad beginning to align to Monday
    const padded = Array(oldestDow).fill(null).concat(cells);
    const weeks: (typeof cells[0] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    // Pad last week to 7
    const lastWeek = weeks[weeks.length - 1];
    while (lastWeek.length < 7) lastWeek.push(null);

    const trackedCount = cells.filter((c) => c.hasData).length;
    const totalDays = cells.length;
    const trackedPct = totalDays > 0 ? Math.round((trackedCount / totalDays) * 100) : 0;

    return { weeks, trackedCount, totalDays, trackedPct };
  }, [summaryMap]);

  // ── SECTION 4: Habit Breakdown ──
  const habitBreakdown = useMemo(() => {
    const withHabits = sealedSummaries.filter((s) => s.habitsTotal > 0);
    if (withHabits.length === 0) return null;
    const totalDone = withHabits.reduce((sum, s) => sum + s.habitsDone, 0);
    const totalAll = withHabits.reduce((sum, s) => sum + s.habitsTotal, 0);
    const rate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
    // Find best day
    let bestDay = withHabits[0];
    for (const s of withHabits) {
      const pct = s.habitsTotal > 0 ? s.habitsDone / s.habitsTotal : 0;
      const bestPct = bestDay.habitsTotal > 0 ? bestDay.habitsDone / bestDay.habitsTotal : 0;
      if (pct > bestPct) bestDay = s;
    }
    return { rate, daysCount: withHabits.length, bestDate: formatEntryDate(bestDay.date), bestPct: bestDay.habitsTotal > 0 ? Math.round((bestDay.habitsDone / bestDay.habitsTotal) * 100) : 0 };
  }, [sealedSummaries]);

  // ── SECTION 5: Daily Log ──
  const filteredEntries: ProcessedEntry[] = useMemo(() => {
    const all = sealedSummaries.map(processSummary);
    if (logFilter === 'ALL') return all;
    const today = new Date();
    if (logFilter === 'THIS_WEEK') {
      const monday = getMondayOfWeek(today);
      const mondayKey = formatDateKey(monday);
      return all.filter((e) => e.date >= mondayKey);
    }
    // THIS_MONTH
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthKey = formatDateKey(monthStart);
    return all.filter((e) => e.date >= monthKey);
  }, [sealedSummaries, logFilter]);

  const toggleEntry = (id: string) => setExpandedId(expandedId === id ? null : id);

  const getStatusClass = (status: DayStatus): string => {
    switch (status) {
      case 'Building': return styles.statusPillIncomplete;
      case 'Strong':
      case 'Elite':
      case 'Unbroken': return styles.statusPillComplete;
      default: return styles.statusPillIncomplete;
    }
  };

  const isEmpty = sealedSummaries.length === 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.titleAccent}>{'// MISSION LOG'}</span>
        <h1 className={styles.title}><span className={styles.titleGradient}>History</span></h1>
        <p className={styles.subtitle}>A record of your daily execution.</p>
      </header>

      {/* SECTION 1: Top Stats Bar */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Current Streak</span>
            <span className={styles.statValue}>
              {topStats.currentStreak}{topStats.currentStreak > 7 ? ' \uD83D\uDD25' : ''}
            </span>
            <span className={styles.statUnit}>days</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Longest Streak</span>
            <span className={styles.statValue}>{topStats.bestStreak}</span>
            <span className={styles.statUnit}>days</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Completion Rate</span>
            <span className={styles.statValue}>{topStats.completionRate}%</span>
            <span className={styles.statUnit}>last 30 days</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Avg Daily Score</span>
            <span className={`${styles.statValue} ${styles.statValueAccent}`}>{topStats.avgDailyScore.toFixed(1)}</span>
            <span className={styles.statUnit}>out of 10</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Days Tracked</span>
            <span className={styles.statValue}>{topStats.daysTracked}</span>
            <span className={styles.statUnit}>total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Days Missed</span>
            <span className={`${styles.statValue} ${topStats.daysMissed > 10 ? styles.statValueDanger : ''}`}>{topStats.daysMissed}</span>
            <span className={styles.statUnit}>last 30 days</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: Week at a Glance */}
      <section className={styles.weekSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionAccent}>{'// WEEK AT A GLANCE'}</span>
          <div className={styles.weekSelector}>
            <button
              type="button"
              className={styles.weekNavBtn}
              onClick={() => setWeekOffset((p) => p - 1)}
              aria-label="Previous week"
            >
              <svg className={styles.navIcon} viewBox="0 0 320 512" fill="currentColor">
                <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
              </svg>
            </button>
            <span className={styles.weekRangeText}>{weekRangeText}</span>
            <button
              type="button"
              className={styles.weekNavBtn}
              onClick={() => setWeekOffset((p) => p + 1)}
              aria-label="Next week"
            >
              <svg className={styles.navIcon} viewBox="0 0 320 512" fill="currentColor">
                <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.weekGrid}>
          {weekData.map((day) => (
            <div
              key={day.date}
              className={`${styles.dayCard} ${day.isToday ? styles.dayCardToday : ''}`}
            >
              <span className={styles.dayLabel}>{day.day}</span>
              <span className={`${styles.dayDate} ${day.isToday ? styles.dayDateToday : ''}`}>
                {day.dateNumber}
              </span>
              <div
                className={`${styles.dayStatusIcon} ${
                  day.status === 'INCOMPLETE' ? styles.dayStatusIncomplete : styles.dayStatusComplete
                }`}
              >
                {day.status === 'INCOMPLETE' ? (
                  <svg className={styles.statusSvg} viewBox="0 0 384 512" fill="currentColor">
                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                  </svg>
                ) : (
                  <svg className={styles.statusSvg} viewBox="0 0 448 512" fill="currentColor">
                    <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                  </svg>
                )}
              </div>
              <span
                className={`${styles.dayStatusText} ${
                  day.status === 'INCOMPLETE' ? styles.dayStatusTextIncomplete : styles.dayStatusTextComplete
                }`}
              >
                {getStatusLabel(day.status)}
              </span>
              <span className={`${styles.dayPoints} ${day.isToday ? styles.dayPointsToday : ''}`}>
                {day.points} pts
              </span>
            </div>
          ))}
        </div>

        {/* Week summary row */}
        <div className={styles.weekSummaryRow}>
          <div className={styles.weekSummaryItem}>
            <span className={styles.weekSummaryLabel}>Days Completed</span>
            <div className={styles.weekSummaryValueRow}>
              <span className={styles.weekSummaryValue}>{weekSummaryStats.daysCompleted}</span>
              <span className={styles.weekSummarySub}>/ 7</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(weekSummaryStats.daysCompleted / 7) * 100}%` }}
              />
            </div>
          </div>
          <div className={styles.weekSummaryItem}>
            <span className={styles.weekSummaryLabel}>Weekly Avg Score</span>
            <div className={styles.weekSummaryValueRow}>
              <span className={styles.weekSummaryValue}>{weekSummaryStats.weeklyAvgScore}</span>
              <span className={styles.weekSummarySub}>pts</span>
            </div>
          </div>
          <div className={styles.weekSummaryItem}>
            <span className={styles.weekSummaryLabel}>Best Streak</span>
            <div className={styles.weekSummaryValueRow}>
              <span className={styles.weekSummaryValue}>{weekSummaryStats.bestStreak}</span>
              <span className={styles.weekSummarySub}>days</span>
            </div>
            {weekSummaryStats.bestStreak > 0 && (
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

      {/* SECTION 3: Tracker Consistency (heatmap) */}
      <section className={styles.heatmapSection}>
        <span className={styles.sectionAccent}>{'// TRACKER CONSISTENCY'}</span>
        <p className={styles.sectionSubtitle}>How often you fill in your daily tracker</p>

        <div className={styles.heatmapContainer}>
          <div className={styles.heatmapDayLabels}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => (
              <span key={i} className={styles.heatmapDayLabel}>{label}</span>
            ))}
          </div>
          <div className={styles.heatmapGrid}>
            {heatmapData.weeks.map((week, wi) => (
              <div key={wi} className={styles.heatmapCol}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`${styles.heatmapCell} ${
                      cell === null
                        ? styles.heatmapCellHidden
                        : cell.hasData
                          ? cell.score >= 80
                            ? styles.heatmapCellHigh
                            : cell.score >= 50
                              ? styles.heatmapCellMed
                              : styles.heatmapCellLow
                          : styles.heatmapCellEmpty
                    }`}
                    title={cell ? `${cell.date}: ${cell.hasData ? cell.score + '%' : 'No data'}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className={styles.heatmapSummary}>
          You have tracked {heatmapData.trackedCount} of the last {heatmapData.totalDays} days ({heatmapData.trackedPct}%)
        </p>
      </section>

      {/* SECTION 4: Habit Breakdown */}
      <section className={styles.habitSection}>
        <span className={styles.sectionAccent}>{'// HABIT BREAKDOWN'}</span>
        {habitBreakdown ? (
          <div className={styles.habitCard}>
            <p className={styles.habitSummary}>
              Habits completed <strong>{habitBreakdown.rate}%</strong> of the time across <strong>{habitBreakdown.daysCount}</strong> days
            </p>
            <div className={styles.habitInsight}>
              <span className={styles.habitInsightLabel}>Insight</span>
              <p className={styles.habitInsightText}>
                Your average habit completion is {habitBreakdown.rate}%. Your best day was {habitBreakdown.bestDate} at {habitBreakdown.bestPct}%.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No habit data yet. Seal your first day to see habit insights.</p>
          </div>
        )}
      </section>

      {/* SECTION 5: Daily Log */}
      <section className={styles.logSection}>
        <div className={styles.logHeader}>
          <span className={styles.sectionAccent}>{'// DAILY LOG'}</span>
          <div className={styles.filterPills}>
            {(['ALL', 'THIS_WEEK', 'THIS_MONTH'] as LogFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.filterPill} ${logFilter === f ? styles.filterPillActive : ''}`}
                onClick={() => setLogFilter(f)}
              >
                {f === 'ALL' ? 'All' : f === 'THIS_WEEK' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {isEmpty && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No sealed days yet</p>
          </div>
        )}

        {!isEmpty && filteredEntries.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No entries for this filter</p>
          </div>
        )}

        {filteredEntries.length > 0 && (
          <div className={styles.logList}>
            {filteredEntries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <div key={entry.id} className={styles.logItem}>
                  <button
                    type="button"
                    className={styles.logButton}
                    onClick={() => toggleEntry(entry.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`entry-${entry.id}-details`}
                  >
                    <div className={styles.logButtonContent}>
                      <div className={styles.logButtonLeft}>
                        <div className={styles.logDate}>{entry.formattedDate}</div>
                        <div className={styles.logCount}>
                          {entry.habitsDone}/{entry.habitsCount} habits &bull; {entry.tasksDone}/{entry.tasksCount} tasks
                        </div>
                      </div>
                      <div className={styles.logButtonRight}>
                        <span className={`${styles.statusPill} ${getStatusClass(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                        <span className={`${styles.logScore} ${entry.status === 'Building' ? styles.logScoreDim : ''}`}>
                          {entry.score.toFixed(1)}
                        </span>
                        <svg
                          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                          viewBox="0 0 320 512"
                          fill="currentColor"
                        >
                          <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div id={`entry-${entry.id}-details`} className={styles.logDetails} role="region">
                      <div className={styles.logDetailsInner}>
                        <p className={styles.logDetailText}>
                          Status: {getStatusLabel(entry.status)} &middot; Score: {entry.score.toFixed(1)}/10
                        </p>
                        <p className={styles.logDetailText}>
                          Habits: {entry.habitsDone}/{entry.habitsCount} &middot; Tasks: {entry.tasksDone}/{entry.tasksCount}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Consistency compounds.&quot;</p>
      </div>
    </div>
  );
}
