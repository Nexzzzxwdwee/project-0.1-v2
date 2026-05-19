'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  getCurrentUserId,
  getDailyTotals,
  getWeeklyTotal,
  getAllTimePR,
  getTodayTotal,
  getSessionsByDateRange,
  deleteSession,
  endSession,
  getActiveSession,
} from '@/lib/focus';
import type { FocusSession, FocusDailyTotal } from '@/lib/types';
import styles from './focus.module.css';

// ── Helpers ──────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimer(s: number): string {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function formatTimeOfDay(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMondayStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.getFullYear(), d.getMonth(), diff);
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
}

function getSundayStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  const sun = new Date(d.getFullYear(), d.getMonth(), diff);
  return `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
}

function getWeekDayDates(): string[] {
  const mon = getMondayStr();
  const [y, m, d] = mon.split('-').map(Number);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(y, m - 1, d + i);
    dates.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`);
  }
  return dates;
}

const LABEL_COLORS: Record<string, string> = {
  Trading: '#3b82f6',
  Coding: '#8b5cf6',
  Reading: '#E0002B',
  Planning: '#14b8a6',
  Review: '#64748b',
};

function getLabelClass(label: string | null): string {
  const l = (label || '').toLowerCase();
  if (l === 'trading') return styles.labelTrading;
  if (l === 'coding') return styles.labelCoding;
  if (l === 'reading') return styles.labelReading;
  if (l === 'planning') return styles.labelPlanning;
  if (l === 'review') return styles.labelReview;
  return styles.labelCustom;
}

function getLabelColor(label: string | null): string {
  return LABEL_COLORS[label || ''] || '#E00030';
}

type LogFilter = 'THIS_WEEK' | 'THIS_MONTH' | 'ALL';

// ── Component ────────────────────────────────────────────────────

export default function FocusPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);
  const [dailyTotals, setDailyTotals] = useState<FocusDailyTotal[]>([]);
  const [personalBest, setPersonalBest] = useState<{ date: string; totalSeconds: number } | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [logFilter, setLogFilter] = useState<LogFilter>('THIS_WEEK');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load settings from localStorage
  const dailyTarget = useMemo(() => {
    if (typeof window === 'undefined') return 4;
    try {
      const s = JSON.parse(localStorage.getItem('focus_settings') || '{}');
      return s.dailyTarget || 4;
    } catch { return 4; }
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const uid = await getCurrentUserId();
      setUserId(uid);

      const [tt, wt, pr, dt, active] = await Promise.all([
        getTodayTotal(uid),
        getWeeklyTotal(uid),
        getAllTimePR(uid),
        getDailyTotals(uid, 90),
        getActiveSession(uid),
      ]);

      setTodayTotal(tt);
      setWeekTotal(wt);
      setPersonalBest(pr);
      setDailyTotals(dt);
      setActiveSession(active);

      // Load sessions for the log
      const now = new Date();
      const ninetyAgo = new Date(now);
      ninetyAgo.setDate(now.getDate() - 90);
      const fromStr = `${ninetyAgo.getFullYear()}-${String(ninetyAgo.getMonth() + 1).padStart(2, '0')}-${String(ninetyAgo.getDate()).padStart(2, '0')}`;
      const toStr = getTodayStr();
      const allSessions = await getSessionsByDateRange(uid, fromStr, toStr);
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to load focus data:', error);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Live timer tick for active session
  useEffect(() => {
    if (!activeSession) return;
    const calc = () => {
      const elapsed = (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000;
      setLiveElapsed(elapsed);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Handle end session from banner
  const handleEndFromBanner = async () => {
    if (!activeSession || !userId) return;
    const elapsed = (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000;
    await endSession(activeSession.id, elapsed);
    setActiveSession(null);
    loadData();
  };

  // ── Computed ───────────────────────────────────────────────────

  const dailyAvg = useMemo(() => {
    if (dailyTotals.length === 0) return 0;
    const total = dailyTotals.reduce((s, t) => s + t.totalSeconds, 0);
    return Math.round(total / 30); // average over 30 days
  }, [dailyTotals]);

  // Streak: consecutive days with at least 1 session
  const currentStreak = useMemo(() => {
    const dateSet = new Set(dailyTotals.map(t => t.date));
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateSet.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [dailyTotals]);

  // Weekly bar chart data
  const weekDays = useMemo(() => getWeekDayDates(), []);
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const todayStr = getTodayStr();

  const weekBarData = useMemo(() => {
    const totalMap = new Map(dailyTotals.map(t => [t.date, t.totalSeconds]));
    return weekDays.map((date, i) => ({
      date,
      label: dayLabels[i],
      seconds: totalMap.get(date) || 0,
      isToday: date === todayStr,
    }));
  }, [weekDays, dailyTotals, todayStr]);

  const maxBarSeconds = useMemo(() => {
    const max = Math.max(...weekBarData.map(d => d.seconds), dailyTarget * 3600);
    return max || 1;
  }, [weekBarData, dailyTarget]);

  // Session log grouped by date
  const filteredSessions = useMemo(() => {
    const completed = sessions.filter(s => s.endedAt);
    if (logFilter === 'THIS_WEEK') {
      const mon = getMondayStr();
      const sun = getSundayStr();
      return completed.filter(s => s.date >= mon && s.date <= sun);
    }
    if (logFilter === 'THIS_MONTH') {
      const d = new Date();
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      return completed.filter(s => s.date >= monthStart);
    }
    return completed;
  }, [sessions, logFilter]);

  const groupedSessions = useMemo(() => {
    const groups = new Map<string, FocusSession[]>();
    // sort newest first
    const sorted = [...filteredSessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    for (const s of sorted) {
      const existing = groups.get(s.date) || [];
      existing.push(s);
      groups.set(s.date, existing);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredSessions]);

  // Heatmap (12 weeks)
  const heatmapData = useMemo(() => {
    const totalMap = new Map(dailyTotals.map(t => [t.date, t]));
    const today = new Date();
    const cells: { date: string; hours: number; sessions: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const t = totalMap.get(key);
      cells.push({ date: key, hours: t ? t.totalSeconds / 3600 : 0, sessions: t ? t.sessionCount : 0 });
    }

    const oldest = new Date(today);
    oldest.setDate(today.getDate() - 83);
    const oldestDow = (oldest.getDay() + 6) % 7;
    const padded: (typeof cells[0] | null)[] = Array(oldestDow).fill(null).concat(cells);
    const weeks: (typeof cells[0] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    const last = weeks[weeks.length - 1];
    while (last.length < 7) last.push(null);

    return weeks;
  }, [dailyTotals]);

  // Label breakdown
  const labelBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (!s.endedAt || !s.durationSeconds) continue;
      const label = s.label || 'Other';
      map.set(label, (map.get(label) || 0) + s.durationSeconds);
    }
    const arr = Array.from(map.entries()).map(([label, seconds]) => ({ label, seconds }));
    arr.sort((a, b) => b.seconds - a.seconds);
    return arr;
  }, [sessions]);

  const maxLabelSeconds = useMemo(() => Math.max(...labelBreakdown.map(l => l.seconds), 1), [labelBreakdown]);

  // Delete handler
  const handleDelete = async (sessionId: string) => {
    if (!userId) return;
    await deleteSession(userId, sessionId);
    setDeleteConfirm(null);
    loadData();
  };

  const isEmpty = sessions.filter(s => s.endedAt).length === 0 && !activeSession;

  if (isEmpty && !activeSession) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.titleAccent}>{'// DEEP WORK'}</span>
          <h1 className={styles.title}><span className={styles.titleGradient}>Focus</span></h1>
        </header>
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 448 512" fill="currentColor">
            <path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h16V98.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.3l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-3.1-3.3-6.4-6.5-9.8-9.5C326.2 116.3 303.9 103.5 280 96.7V64h16c17.7 0 32-14.3 32-32s-14.3-32-32-32H176zM288 304a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z" />
          </svg>
          <p className={styles.emptyTitle}>No focus sessions yet</p>
          <p className={styles.emptyText}>Start your first session from the <Link href="/today" style={{ color: 'var(--accent)' }}>Today page</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.titleAccent}>{'// DEEP WORK'}</span>
        <h1 className={styles.title}><span className={styles.titleGradient}>Focus</span></h1>
        <p className={styles.subtitle}>Track your deep work sessions and build consistency.</p>
      </header>

      {/* Active Session Banner */}
      {activeSession && (
        <div className={styles.activeBanner}>
          <div className={styles.activeBannerLeft}>
            <div className={styles.liveDot} />
            <span className={styles.bannerText}>
              SESSION IN PROGRESS {activeSession.label ? `\u2014 ${activeSession.label}` : ''}
            </span>
            <span className={styles.bannerTimer}>{formatTimer(liveElapsed)}</span>
          </div>
          <button type="button" className={styles.bannerEndBtn} onClick={handleEndFromBanner}>
            END SESSION
          </button>
        </div>
      )}

      {/* Top Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Today</span>
          <span className={`${styles.statValue} ${styles.statValueAccent}`}>{formatSeconds(todayTotal)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>This Week</span>
          <span className={styles.statValue}>{formatSeconds(weekTotal)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Daily Avg</span>
          <span className={styles.statValue}>{formatSeconds(dailyAvg)}</span>
          <span className={styles.statSub}>last 30 days</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Personal Best</span>
          <span className={`${styles.statValue} ${styles.statValueAccent}`}>
            {personalBest ? formatSeconds(personalBest.totalSeconds) : '--'}
          </span>
          {personalBest && <span className={styles.statSub}>{formatDateNice(personalBest.date)}</span>}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Streak</span>
          <span className={styles.statValue}>{currentStreak}</span>
          <span className={styles.statSub}>days</span>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <section className={styles.section}>
        <span className={styles.sectionAccent}>{'// THIS WEEK'}</span>
        <div className={styles.chartCard}>
          <div className={styles.barChartContainer}>
            {/* Target line */}
            <div
              className={styles.targetLine}
              style={{ bottom: `${(dailyTarget * 3600 / maxBarSeconds) * 100}%` }}
            >
              <span className={styles.targetLabel}>target: {dailyTarget}h</span>
            </div>

            {weekBarData.map((d) => {
              const pct = maxBarSeconds > 0 ? (d.seconds / maxBarSeconds) * 100 : 0;
              const hours = d.seconds / 3600;
              let barClass = styles.barGreen;
              if (d.seconds === 0) barClass = styles.barRed;
              else if (hours < dailyTarget) barClass = styles.barAmber;

              return (
                <div key={d.date} className={styles.barColumn}>
                  <span className={styles.barValue}>{d.seconds > 0 ? formatSeconds(d.seconds) : ''}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.bar} ${barClass} ${d.isToday ? styles.barToday : ''}`}
                      style={{ height: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                  <span className={`${styles.barLabel} ${d.isToday ? styles.barLabelToday : ''}`}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Session Log */}
      <section className={styles.section}>
        <span className={styles.sectionAccent}>{'// SESSION LOG'}</span>
        <div className={styles.filterRow}>
          {(['THIS_WEEK', 'THIS_MONTH', 'ALL'] as LogFilter[]).map(f => (
            <button
              key={f}
              type="button"
              className={`${styles.filterPill} ${logFilter === f ? styles.filterPillActive : ''}`}
              onClick={() => setLogFilter(f)}
            >
              {f === 'THIS_WEEK' ? 'This Week' : f === 'THIS_MONTH' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {groupedSessions.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono), monospace', fontSize: '0.875rem' }}>
            No sessions for this period.
          </p>
        )}

        {groupedSessions.map(([date, dateSessions]) => {
          const totalSec = dateSessions.reduce((s, sess) => s + (sess.durationSeconds || 0), 0);
          return (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateGroupHeader}>
                <span>{formatDateNice(date)}</span>
                <span>{dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''} &middot; {formatSeconds(totalSec)}</span>
              </div>
              {dateSessions.map(sess => (
                <div key={sess.id} className={styles.sessionRow}>
                  <span className={styles.sessionTime}>
                    {formatTimeOfDay(sess.startedAt)} &rarr; {sess.endedAt ? formatTimeOfDay(sess.endedAt) : '...'}
                  </span>
                  <span className={styles.sessionDuration}>
                    {sess.durationSeconds ? formatSeconds(sess.durationSeconds) : '--'}
                  </span>
                  {sess.label && (
                    <span className={`${styles.labelPill} ${getLabelClass(sess.label)}`}>{sess.label}</span>
                  )}
                  <span className={styles.sessionNotes} title={sess.notes || ''}>{sess.notes || ''}</span>
                  <button
                    type="button"
                    className={styles.sessionDeleteBtn}
                    onClick={() => setDeleteConfirm(sess.id)}
                    aria-label="Delete session"
                  >
                    <svg viewBox="0 0 384 512" fill="currentColor">
                      <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </section>

      {/* Focus Heatmap */}
      <section className={styles.section}>
        <span className={styles.sectionAccent}>{'// FOCUS CONSISTENCY'}</span>
        <div className={styles.heatmapCard}>
          <div className={styles.heatmapContainer}>
            <div className={styles.heatmapDayLabels}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
                <span key={i} className={styles.heatmapDayLabel}>{l}</span>
              ))}
            </div>
            <div className={styles.heatmapGrid}>
              {heatmapData.map((week, wi) => (
                <div key={wi} className={styles.heatmapCol}>
                  {week.map((cell, di) => {
                    if (!cell) return <div key={di} className={`${styles.heatmapCell} ${styles.heatmapCellHidden}`} />;
                    let cls = styles.heatmapCellEmpty;
                    if (cell.hours > 0 && cell.hours < 1) cls = styles.heatmapCellL1;
                    else if (cell.hours >= 1 && cell.hours < 2) cls = styles.heatmapCellL2;
                    else if (cell.hours >= 2 && cell.hours < 4) cls = styles.heatmapCellL3;
                    else if (cell.hours >= 4) cls = styles.heatmapCellL4;
                    return (
                      <div
                        key={di}
                        className={`${styles.heatmapCell} ${cls}`}
                        title={`${cell.date} \u2014 ${cell.hours > 0 ? formatSeconds(cell.hours * 3600) + ` across ${cell.sessions} session${cell.sessions !== 1 ? 's' : ''}` : 'No sessions'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.heatmapLegend}>
            <span>Less</span>
            <div className={`${styles.legendCell} ${styles.heatmapCellEmpty}`} />
            <div className={`${styles.legendCell} ${styles.heatmapCellL1}`} />
            <div className={`${styles.legendCell} ${styles.heatmapCellL2}`} />
            <div className={`${styles.legendCell} ${styles.heatmapCellL3}`} />
            <div className={`${styles.legendCell} ${styles.heatmapCellL4}`} />
            <span>More</span>
          </div>
        </div>
      </section>

      {/* Label Breakdown */}
      {labelBreakdown.length > 0 && (
        <section className={styles.section}>
          <span className={styles.sectionAccent}>{'// BY FOCUS TYPE'}</span>
          <div className={styles.labelBreakdownCard}>
            {labelBreakdown.map(({ label, seconds }) => (
              <div key={label} className={styles.labelRow}>
                <span className={styles.labelRowName}>{label}</span>
                <div className={styles.labelBarTrack}>
                  <div
                    className={styles.labelBarFill}
                    style={{
                      width: `${(seconds / maxLabelSeconds) * 100}%`,
                      background: getLabelColor(label),
                    }}
                  />
                </div>
                <span className={styles.labelRowValue}>{formatSeconds(seconds)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Session</h3>
            <p className={styles.modalText}>Are you sure you want to delete this focus session? This cannot be undone.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className={styles.modalDeleteBtn} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Deep work is the superpower of the 21st century.&quot;</p>
      </div>
    </div>
  );
}
