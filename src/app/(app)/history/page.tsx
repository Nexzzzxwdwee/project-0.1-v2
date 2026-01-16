'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllSealedDaySummaries, getUserProgress, type DaySummary, type DayStatus } from '@/lib/presets';
import styles from './history.module.css';

interface ProcessedEntry {
  id: string; // date
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g., "Monday, Jan 20"
  habitsCount: number;
  tasksCount: number;
  habitsDone: number;
  tasksDone: number;
  status: DayStatus;
  score: number; // totalScorePct / 10 (0-10 scale)
  isSealed: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00'); // Add time to avoid timezone issues
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

function calculateAvgDailyScore(summaries: DaySummary[]): number {
  if (summaries.length === 0) return 0;
  
  // Get last 7 sealed summaries (or all if less than 7)
  const recent = summaries.slice(0, 7);
  
  if (recent.length === 0) return 0;
  
  // Map 0-100 to 0-10 by dividing by 10
  const total = recent.reduce((sum, s) => sum + (s.totalScorePct / 10), 0);
  return Math.round((total / recent.length) * 10) / 10; // Round to 1 decimal
}

function calculateCompletionRate(summaries: DaySummary[]): number {
  if (summaries.length === 0) return 0;
  
  // Get today's date
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  // Filter summaries in last 30 days
  const recent = summaries.filter((s) => {
    const summaryDate = new Date(s.date + 'T00:00:00');
    return summaryDate >= thirtyDaysAgo && summaryDate <= today;
  });
  
  // Count sealed days in last 30 days
  const sealedCount = recent.length;
  
  // Calculate percentage (cap 0-100)
  const rate = Math.round((sealedCount / 30) * 100);
  return Math.min(100, Math.max(0, rate));
}

function processSummary(summary: DaySummary): ProcessedEntry {
  return {
    id: summary.date,
    date: summary.date,
    formattedDate: formatDate(summary.date),
    habitsCount: summary.habitsTotal || 0,
    tasksCount: summary.tasksTotal || 0,
    habitsDone: summary.habitsDone || 0,
    tasksDone: summary.tasksDone || 0,
    status: summary.status,
    score: summary.totalScorePct / 10, // Convert 0-100 to 0-10
    isSealed: summary.isSealed,
  };
}

export default function HistoryPage() {
  const [sealedSummaries, setSealedSummaries] = useState<DaySummary[]>([]);
  const [userProgress, setUserProgress] = useState<ReturnType<typeof getUserProgress>>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // READ ONLY: Only read from localStorage, never write
    const summaries = getAllSealedDaySummaries();
    setSealedSummaries(summaries);
    
    const progress = getUserProgress();
    setUserProgress(progress);
  }, []);

  const processedEntries: ProcessedEntry[] = useMemo(() => {
    return sealedSummaries.map(processSummary);
  }, [sealedSummaries]);

  const summaryData = useMemo(() => {
    return {
      currentStreak: userProgress?.currentStreak || 0,
      avgDailyScore: calculateAvgDailyScore(sealedSummaries),
      completionRate: calculateCompletionRate(sealedSummaries),
    };
  }, [sealedSummaries, userProgress]);

  const toggleEntry = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusLabel = (status: DayStatus): string => {
    switch (status) {
      case 'Building':
        return 'BUILDING';
      case 'Strong':
        return 'STRONG';
      case 'Elite':
        return 'ELITE';
      case 'Unbroken':
        return 'UNBROKEN';
      default:
        return 'BUILDING';
    }
  };

  const getStatusClass = (status: DayStatus): string => {
    switch (status) {
      case 'Building':
        return styles.statusPillIncomplete;
      case 'Strong':
      case 'Elite':
      case 'Unbroken':
        return styles.statusPillComplete;
      default:
        return styles.statusPillIncomplete;
    }
  };

  const isEmpty = sealedSummaries.length === 0;

  return (
    <div className={styles.page}>
      {/* Header Section */}
      <header className={styles.header}>
        <h1 className={styles.title}>History</h1>
        <p className={styles.subtitle}>A record of your daily execution.</p>
      </header>

      {/* Summary Section */}
      <section className={styles.summarySection}>
        <div className={styles.summaryGrid}>
          {/* Current Streak */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Current Streak</div>
            <div className={styles.summaryValue}>{summaryData.currentStreak}</div>
            <div className={styles.summarySubtext}>days</div>
          </div>

          {/* Average Daily Score */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Avg Daily Score</div>
            <div className={`${styles.summaryValue} ${styles.summaryValueGreen}`}>
              {summaryData.avgDailyScore.toFixed(1)}
            </div>
            <div className={styles.summarySubtext}>out of 10</div>
          </div>

          {/* Completion Rate */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Completion Rate</div>
            <div className={styles.summaryValue}>{summaryData.completionRate}%</div>
            <div className={styles.summarySubtext}>last 30 days</div>
          </div>
        </div>
      </section>

      {/* Daily Log Section */}
      <section className={styles.dailyLogSection}>
        <h2 className={styles.dailyLogTitle}>Daily Log</h2>

        {isEmpty && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No sealed days yet</p>
          </div>
        )}

        {!isEmpty && (
          <div className={styles.dailyLogList}>
            {processedEntries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <div key={entry.id} className={styles.dailyLogItem}>
                  <button
                    type="button"
                    className={styles.dailyLogButton}
                    onClick={() => toggleEntry(entry.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`entry-${entry.id}-details`}
                  >
                    <div className={styles.dailyLogButtonContent}>
                      <div className={styles.dailyLogButtonLeft}>
                        <div className={styles.dailyLogDate}>{entry.formattedDate}</div>
                        <div className={styles.dailyLogCount}>
                          {entry.habitsDone} / {entry.habitsCount} habits • {entry.tasksDone} / {entry.tasksCount} tasks
                        </div>
                      </div>
                      <div className={styles.dailyLogButtonRight}>
                        <span
                          className={`${styles.statusPill} ${getStatusClass(entry.status)}`}
                        >
                          {getStatusLabel(entry.status)}
                        </span>
                        <span
                          className={`${styles.dailyLogScore} ${
                            entry.status === 'Building' ? styles.dailyLogScoreIncomplete : ''
                          }`}
                        >
                          {entry.score.toFixed(1)}
                        </span>
                        <svg
                          className={`${styles.chevronIcon} ${isExpanded ? styles.chevronIconExpanded : ''}`}
                          viewBox="0 0 320 512"
                          fill="currentColor"
                        >
                          <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content - Not showing details for now as per requirements */}
                  {isExpanded && (
                    <div
                      id={`entry-${entry.id}-details`}
                      className={styles.dailyLogDetails}
                      role="region"
                      aria-labelledby={`entry-${entry.id}-button`}
                    >
                      <div className={styles.dailyLogDetailsContent}>
                        <div className={styles.detailsSection}>
                          <p className={styles.emptyStateText}>
                            Details for {entry.formattedDate}
                          </p>
                          <p className={styles.emptyStateText} style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            Status: {getStatusLabel(entry.status)} • Score: {entry.score.toFixed(1)}/10
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer Quote */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Consistency is the foundation of progress.&quot;</p>
      </div>
    </div>
  );
}
