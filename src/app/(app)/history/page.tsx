'use client';

import { useState } from 'react';
import styles from './history.module.css';

interface Habit {
  name: string;
  completed: boolean;
}

interface Task {
  text: string;
  completed: boolean;
}

interface DailyEntry {
  id: number;
  date: string;
  habitsCount: number;
  tasksCount: number;
  status: 'ELITE' | 'COMPLETE' | 'INCOMPLETE';
  score: number;
  habits: Habit[];
  tasks: Task[];
}

const summaryData = {
  currentStreak: 12,
  avgDailyScore: 8.4,
  completionRate: 84,
};

const dailyEntries: DailyEntry[] = [
  {
    id: 1,
    date: 'Monday, Jan 20',
    habitsCount: 4,
    tasksCount: 3,
    status: 'ELITE',
    score: 9.2,
    habits: [
      { name: 'morning sauna', completed: true },
      { name: 'deep work block', completed: true },
      { name: 'read 30 mins', completed: true },
      { name: 'zero sugar', completed: true },
    ],
    tasks: [
      { text: 'email client reports', completed: true },
      { text: 'team standup meeting', completed: true },
      { text: 'review quarterly goals', completed: true },
    ],
  },
  {
    id: 2,
    date: 'Sunday, Jan 19',
    habitsCount: 4,
    tasksCount: 3,
    status: 'COMPLETE',
    score: 8.0,
    habits: [
      { name: 'morning sauna', completed: true },
      { name: 'deep work block', completed: true },
      { name: 'read 30 mins', completed: true },
      { name: 'zero sugar', completed: true },
    ],
    tasks: [
      { text: 'email client reports', completed: true },
      { text: 'team standup meeting', completed: true },
      { text: 'review quarterly goals', completed: true },
    ],
  },
  {
    id: 3,
    date: 'Saturday, Jan 18',
    habitsCount: 3,
    tasksCount: 2,
    status: 'INCOMPLETE',
    score: 6.5,
    habits: [
      { name: 'morning sauna', completed: true },
      { name: 'deep work block', completed: true },
      { name: 'read 30 mins', completed: false },
    ],
    tasks: [
      { text: 'email client reports', completed: true },
      { text: 'team standup meeting', completed: false },
    ],
  },
  {
    id: 4,
    date: 'Friday, Jan 17',
    habitsCount: 4,
    tasksCount: 3,
    status: 'COMPLETE',
    score: 8.7,
    habits: [
      { name: 'morning sauna', completed: true },
      { name: 'deep work block', completed: true },
      { name: 'read 30 mins', completed: true },
      { name: 'zero sugar', completed: true },
    ],
    tasks: [
      { text: 'email client reports', completed: true },
      { text: 'team standup meeting', completed: true },
      { text: 'review quarterly goals', completed: true },
    ],
  },
];

export default function HistoryPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleEntry = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
              {summaryData.avgDailyScore}
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

        <div className={styles.dailyLogList}>
          {dailyEntries.map((entry) => {
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
                      <div className={styles.dailyLogDate}>{entry.date}</div>
                      <div className={styles.dailyLogCount}>
                        {entry.habitsCount} habits • {entry.tasksCount} tasks
                      </div>
                    </div>
                    <div className={styles.dailyLogButtonRight}>
                      <span
                        className={`${styles.statusPill} ${
                          entry.status === 'INCOMPLETE' ? styles.statusPillIncomplete : styles.statusPillComplete
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span
                        className={`${styles.dailyLogScore} ${
                          entry.status === 'INCOMPLETE' ? styles.dailyLogScoreIncomplete : ''
                        }`}
                      >
                        {entry.score}
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

                {/* Expanded Content */}
                {isExpanded && (
                  <div
                    id={`entry-${entry.id}-details`}
                    className={styles.dailyLogDetails}
                    role="region"
                    aria-labelledby={`entry-${entry.id}-button`}
                  >
                    <div className={styles.dailyLogDetailsContent}>
                      {/* Habits */}
                      <div className={styles.detailsSection}>
                        <h4 className={styles.detailsSectionTitle}>Habits</h4>
                        <div className={styles.detailsList}>
                          {entry.habits.map((habit, index) => (
                            <div key={index} className={styles.detailsItem}>
                              {habit.completed ? (
                                <svg
                                  className={styles.checkIcon}
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                >
                                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47.5 47.5L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                                </svg>
                              ) : (
                                <svg
                                  className={styles.circleIcon}
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                >
                                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                                </svg>
                              )}
                              <span
                                className={`${styles.detailsItemText} ${
                                  habit.completed ? '' : styles.detailsItemTextIncomplete
                                }`}
                              >
                                {habit.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tasks */}
                      <div className={styles.detailsSection}>
                        <h4 className={styles.detailsSectionTitle}>Tasks</h4>
                        <div className={styles.detailsList}>
                          {entry.tasks.map((task, index) => (
                            <div key={index} className={styles.detailsItem}>
                              {task.completed ? (
                                <svg
                                  className={styles.checkIcon}
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                >
                                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47.5 47.5L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                                </svg>
                              ) : (
                                <svg
                                  className={styles.circleIcon}
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                >
                                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                                </svg>
                              )}
                              <span
                                className={`${styles.detailsItemText} ${
                                  task.completed ? '' : styles.detailsItemTextIncomplete
                                }`}
                              >
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Quote */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Consistency is the foundation of progress.&quot;</p>
      </div>
    </div>
  );
}
