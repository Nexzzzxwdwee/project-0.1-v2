'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  getAccounts,
  getTrades,
  getEquityCurve,
  parseSize,
  getStreakStats,
  getPerformanceRatios,
  type StreakStats,
  type PerformanceRatios,
} from '@/lib/trading';
import type { TradingAccount, Trade, REquityCurvePoint } from '@/lib/types';
import styles from './dashboard.module.css';

type TimeFilter = 'all' | '3m' | '1m' | '1w';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#6366f1', '#475569', '#d97706', '#16a34a', '#334155', '#84cc16'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDateRange(filter: TimeFilter): { from?: string; to?: string } {
  if (filter === 'all') return {};
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  const d = new Date(now);
  if (filter === '3m') d.setMonth(d.getMonth() - 3);
  else if (filter === '1m') d.setMonth(d.getMonth() - 1);
  else d.setDate(d.getDate() - 7);
  return { from: d.toISOString().split('T')[0], to };
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

interface PieSlice { name: string; value: number; }

function PieChartCard({ title, data, valueLabel }: { title: string; data: PieSlice[]; valueLabel?: (v: PieSlice) => string }) {
  if (data.length === 0) return <div className={styles.pieCard}><div className={styles.pieCardTitle}>{title}</div><div className={styles.pieEmpty}>No data</div></div>;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={styles.pieCard}>
      <div className={styles.pieCardTitle}>{title}</div>
      <div className={styles.pieChartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '6px', color: '#f5f5f5', fontFamily: 'var(--font-mono), monospace', fontSize: '0.625rem' }} formatter={(value, name) => { const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0; return [`${pct}%`, String(name)]; }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.pieLegend}>
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const label = valueLabel ? valueLabel(d) : `${pct}%`;
          return <div key={d.name} className={styles.pieLegendItem}><span className={styles.pieLegendDot} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name} ({label})</div>;
        })}
      </div>
    </div>
  );
}

// Mini semicircle gauge for win rate
function MiniGauge({ pct }: { pct: number }) {
  const r = 20;
  const cx = 24;
  const cy = 24;
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweep = Math.PI * (pct / 100);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(startAngle - sweep);
  const y2 = cy - r * Math.sin(startAngle - sweep);
  const largeArc = pct > 50 ? 1 : 0;
  return (
    <svg width="48" height="28" viewBox="0 0 48 28" className={styles.miniGauge}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--border)" strokeWidth="4" />
      {pct > 0 && <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" />}
    </svg>
  );
}

export default function TradingDashboard() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [perfRatios, setPerfRatios] = useState<PerformanceRatios | null>(null);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });

  useEffect(() => {
    let mounted = true;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const [accts, trades, streaks, perf] = await Promise.all([
        getAccounts(user.id),
        getTrades(user.id),
        getStreakStats(user.id),
        getPerformanceRatios(user.id),
      ]);
      if (!mounted) return;
      setAccounts(accts);
      setAllTrades(trades);
      setStreakStats(streaks);
      setPerfRatios(perf);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Filtered equity curve
  const filteredCurve = useMemo(() => {
    let trades = allTrades;
    if (accountFilter) trades = trades.filter((t) => t.accountIds.includes(accountFilter));
    if (modelFilter) trades = trades.filter((t) => t.model === modelFilter);
    const range = getDateRange(timeFilter);
    if (range.from) trades = trades.filter((t) => t.date >= range.from!);
    if (range.to) trades = trades.filter((t) => t.date <= range.to!);
    let cumulative = 0;
    return trades.map((t, i) => {
      cumulative += t.result;
      return { date: t.date, cumulativeR: Math.round(cumulative * 100) / 100, tradeNumber: i + 1 };
    });
  }, [allTrades, timeFilter, accountFilter, modelFilter]);

  // Unique models from trades for filter
  const uniqueModels = useMemo(() => {
    const set = new Set(allTrades.map((t) => t.model).filter(Boolean));
    return Array.from(set).sort();
  }, [allTrades]);

  // Stats
  const stats = useMemo(() => {
    const activeAccounts = accounts.filter((a) => a.status === 'active');
    const monthRange = getMonthRange();
    const monthTrades = allTrades.filter((t) => t.date >= monthRange.from && t.date <= monthRange.to);
    const totalRMonth = monthTrades.reduce((s, t) => s + t.result, 0);
    const totalRAll = allTrades.reduce((s, t) => s + t.result, 0);
    const wins = allTrades.filter((t) => t.result > 0);
    const losses = allTrades.filter((t) => t.result <= 0);
    const winRate = allTrades.length > 0 ? Math.round((wins.length / allTrades.length) * 100) : 0;
    const totalFunding = activeAccounts.reduce((s, a) => s + parseSize(a.size), 0);
    const firms = new Set(activeAccounts.map((a) => a.firm));
    return {
      activeCount: activeAccounts.length,
      totalFunding,
      firmCount: firms.size,
      totalRMonth: Math.round(totalRMonth * 100) / 100,
      monthTradeCount: monthTrades.length,
      totalRAll: Math.round(totalRAll * 100) / 100,
      totalTradeCount: allTrades.length,
      winRate,
      winCount: wins.length,
      lossCount: losses.length,
    };
  }, [accounts, allTrades]);

  // Per-account R totals
  const accountRTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTrades) {
      for (const aid of t.accountIds) map.set(aid, (map.get(aid) || 0) + t.result);
    }
    return map;
  }, [allTrades]);

  // Pie data
  const firmPieData = useMemo((): PieSlice[] => {
    const active = accounts.filter((a) => a.status === 'active');
    const map = new Map<string, number>();
    for (const a of active) map.set(a.firm, (map.get(a.firm) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [accounts]);

  const modelPieData = useMemo((): PieSlice[] => {
    const active = accounts.filter((a) => a.status === 'active');
    const map = new Map<string, number>();
    for (const a of active) map.set(a.model, (map.get(a.model) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [accounts]);

  const sessionPieData = useMemo((): PieSlice[] => {
    const map = new Map<string, number>();
    for (const t of allTrades) map.set(t.session, (map.get(t.session) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [allTrades]);

  const assetPieData = useMemo((): PieSlice[] => {
    const map = new Map<string, number>();
    for (const t of allTrades) map.set(t.asset, (map.get(t.asset) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [allTrades]);

  // Calendar heatmap
  const calendarData = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay(); // 0=Sun

    // R per day in this month
    const dayR = new Map<number, { r: number; count: number }>();
    for (const t of allTrades) {
      const d = new Date(t.date + 'T00:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const existing = dayR.get(day) || { r: 0, count: 0 };
        existing.r += t.result;
        existing.count++;
        dayR.set(day, existing);
      }
    }

    // Build weeks
    const weeks: Array<Array<{ day: number; r: number; count: number; outside: boolean; isToday: boolean } | null>> = [];
    let week: typeof weeks[0] = [];
    for (let i = 0; i < startDow; i++) week.push(null); // pad start
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const data = dayR.get(d);
      const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
      week.push({ day: d, r: Math.round((data?.r || 0) * 100) / 100, count: data?.count || 0, outside: false, isToday });
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    // Weekly totals
    const weekTotals = weeks.map((w) => w.reduce((s, c) => s + (c?.r || 0), 0));

    // Monthly summary
    const monthTrades = allTrades.filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const winDays = Array.from(dayR.values()).filter((d) => d.r > 0).length;
    const lossDays = Array.from(dayR.values()).filter((d) => d.r < 0).length;
    let bestDay = 0;
    let worstDay = 0;
    for (const d of dayR.values()) {
      if (d.r > bestDay) bestDay = d.r;
      if (d.r < worstDay) worstDay = d.r;
    }

    return { weeks, weekTotals, totalTrades: monthTrades.length, winDays, lossDays, bestDay: Math.round(bestDay * 100) / 100, worstDay: Math.round(worstDay * 100) / 100 };
  }, [allTrades, calMonth]);

  if (loading) return <div className={styles.loadingState}>Loading trading data...</div>;

  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const statusBadgeClass = (s: string) => s === 'active' ? styles.badgeActive : s === 'passed' ? styles.badgePassed : s === 'blown' ? styles.badgeBlown : styles.badgeLimbo;

  const ratioTotal = (perfRatios?.avgWin || 0) + (perfRatios?.avgLoss || 0);
  const ratioWinPct = ratioTotal > 0 ? ((perfRatios?.avgWin || 0) / ratioTotal) * 100 : 50;

  const pfColor = (perfRatios?.profitFactor || 0) >= 2 ? 'var(--success)' : (perfRatios?.profitFactor || 0) >= 1 ? 'var(--warning)' : 'var(--danger)';
  const csColor = (perfRatios?.consistencyScore || 0) >= 60 ? 'var(--success)' : (perfRatios?.consistencyScore || 0) >= 40 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div>
      <header className={styles.header}>
        <div>
          <span className={styles.titleAccent}>{'// COMMAND CENTRE'}</span>
          <h1 className={styles.title}>Trading <span className={styles.titleGradient}>Dashboard</span></h1>
        </div>
        <Link href="/trading/journal?mode=log" className={styles.logTradeBtn}>+ Log Trade</Link>
      </header>

      {/* ─── 8 Stat Cards ─── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Accounts</div>
          <div className={styles.statValue}>{stats.activeCount}</div>
          <div className={styles.statSub}>across {stats.firmCount} firm{stats.firmCount !== 1 ? 's' : ''}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Funding</div>
          <div className={`${styles.statValue} ${styles.statAmber}`}>{formatCurrency(stats.totalFunding)}</div>
          <div className={styles.statSub}>across {stats.firmCount} firm{stats.firmCount !== 1 ? 's' : ''}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>R This Month</div>
          <div className={`${styles.statValue} ${stats.totalRMonth >= 0 ? styles.statGreen : styles.statRed}`}>{stats.totalRMonth >= 0 ? '+' : ''}{stats.totalRMonth}R</div>
          <div className={styles.statSub}>{stats.monthTradeCount} trade{stats.monthTradeCount !== 1 ? 's' : ''} this month</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>R All Time</div>
          <div className={`${styles.statValue} ${stats.totalRAll >= 0 ? styles.statGreen : styles.statRed}`}>{stats.totalRAll >= 0 ? '+' : ''}{stats.totalRAll}R</div>
          <div className={styles.statSub}>{stats.totalTradeCount} total trades</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Win Rate</div>
          <div className={styles.statValue}>{stats.winRate}%</div>
          <div className={styles.statSub}>{stats.winCount}W / {stats.lossCount}L</div>
          <MiniGauge pct={stats.winRate} />
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Avg Win / Loss</div>
          <div className={styles.statValue}>{ratioTotal > 0 ? (perfRatios!.avgWin / (perfRatios!.avgLoss || 1)).toFixed(2) : '—'}</div>
          <div className={styles.statSub}>avg {perfRatios?.avgWin || 0}R / -{perfRatios?.avgLoss || 0}R</div>
          <div className={styles.ratioBar}>
            <div className={styles.ratioBarWin} style={{ width: `${ratioWinPct}%` }} />
            <div className={styles.ratioBarLoss} style={{ width: `${100 - ratioWinPct}%` }} />
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Highest Streak</div>
          <div className={`${styles.statValue} ${styles.statAmber}`}>{streakStats?.highestWinStreak || 0}</div>
          <div className={styles.statSub}>consecutive wins</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Current Streak</div>
          <div className={`${styles.statValue} ${streakStats?.streakIsActive ? styles.statGreen : ''}`}>{streakStats?.currentWinStreak || 0}{streakStats?.streakIsActive && (streakStats?.currentWinStreak || 0) > 5 ? ' 🔥' : ''}</div>
          <div className={styles.statSub}>{streakStats?.streakIsActive ? 'active' : streakStats?.streakBrokenDate ? `ended ${streakStats.streakBrokenDate}` : 'no streak'}</div>
        </div>
      </div>

      {/* ─── Equity Curve + Accounts ─── */}
      <div className={styles.mainGrid}>
        <div className={styles.chartPanel}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>R Equity Curve</span>
            <div className={styles.chartFilters}>
              <button type="button" className={`${styles.chartFilterBtn} ${modelFilter === null ? styles.chartFilterBtnActive : ''}`} onClick={() => setModelFilter(null)}>All Models</button>
              {uniqueModels.map((m) => <button key={m} type="button" className={`${styles.chartFilterBtn} ${modelFilter === m ? styles.chartFilterBtnActive : ''}`} onClick={() => setModelFilter(m)}>{m}</button>)}
            </div>
            <div className={styles.chartFilters}>
              {(['all', '3m', '1m', '1w'] as TimeFilter[]).map((f) => <button key={f} type="button" className={`${styles.chartFilterBtn} ${timeFilter === f ? styles.chartFilterBtnActive : ''}`} onClick={() => setTimeFilter(f)}>{f === 'all' ? 'All Time' : f.toUpperCase()}</button>)}
            </div>
          </div>
          <div className={styles.chartArea}>
            {filteredCurve.length === 0 ? <div className={styles.chartEmpty}>No trades to display</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredCurve} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="curvePos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="curveNeg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={{ stroke: '#1e1e1e' }} tickLine={false} tickFormatter={(v: string) => { const d = new Date(v + 'T00:00:00'); return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`; }} />
                  <YAxis tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={{ stroke: '#1e1e1e' }} tickLine={false} tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}R`} />
                  <ReferenceLine y={0} stroke="#1e1e1e" strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '6px', color: '#f5f5f5', fontFamily: 'var(--font-mono), monospace', fontSize: '0.625rem' }} formatter={(value) => [`${value}R`, 'Cumulative R']} labelFormatter={(label) => { const d = new Date(label + 'T00:00:00'); return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }} />
                  <Area type="monotone" dataKey="cumulativeR" stroke={filteredCurve[filteredCurve.length - 1]?.cumulativeR >= 0 ? '#3b82f6' : '#ef4444'} strokeWidth={2} fill={filteredCurve[filteredCurve.length - 1]?.cumulativeR >= 0 ? 'url(#curvePos)' : 'url(#curveNeg)'} dot={false} activeDot={{ r: 4, stroke: '#f5f5f5', strokeWidth: 2, fill: filteredCurve[filteredCurve.length - 1]?.cumulativeR >= 0 ? '#3b82f6' : '#ef4444' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={styles.accountsPanel}>
          <div className={styles.accountsPanelTitle}>Active Accounts</div>
          {activeAccounts.length === 0 ? <div className={styles.accountsEmpty}>No active accounts</div> : activeAccounts.map((a) => {
            const r = Math.round((accountRTotals.get(a.id) || 0) * 100) / 100;
            const healthPct = Math.min(100, Math.max(0, ((r + 10) / 20) * 100));
            const healthColor = r >= 0 ? 'var(--success)' : r > -3 ? 'var(--warning)' : 'var(--danger)';
            return (
              <div key={a.id} className={styles.accountCard}>
                <div className={styles.accountCardTop}>
                  <span className={styles.accountFirm}>{a.firm} {a.size}</span>
                  <span className={`${styles.accountBadge} ${statusBadgeClass(a.status)}`}>{a.stage}</span>
                </div>
                <div className={styles.accountMeta}><span>{a.model}</span><span>{a.asset}</span></div>
                <div className={styles.accountR} style={{ color: r >= 0 ? 'var(--success)' : 'var(--danger)' }}>{r >= 0 ? '+' : ''}{r}R</div>
                <div className={styles.accountProgressTrack}><div className={styles.accountProgressFill} style={{ width: `${healthPct}%`, backgroundColor: healthColor }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Calendar Heatmap ─── */}
      <div className={styles.calendarSection}>
        <div className={styles.calendarPanel}>
          <div className={styles.calendarHeader}>
            <div className={styles.sectionLabel}>{'// DAILY R CALENDAR'}</div>
            <div className={styles.calendarNav}>
              <button type="button" className={styles.calendarNavBtn} onClick={() => setCalMonth((p) => { const m = p.month - 1; return m < 0 ? { year: p.year - 1, month: 11 } : { ...p, month: m }; })}>
                <svg viewBox="0 0 320 512" fill="currentColor"><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>
              </button>
              <span className={styles.calendarMonthLabel}>{MONTH_NAMES[calMonth.month]} {calMonth.year}</span>
              <button type="button" className={styles.calendarNavBtn} onClick={() => setCalMonth((p) => { const m = p.month + 1; return m > 11 ? { year: p.year + 1, month: 0 } : { ...p, month: m }; })}>
                <svg viewBox="0 0 320 512" fill="currentColor"><path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" /></svg>
              </button>
            </div>
          </div>

          <div className={styles.calendarGrid}>
            <div /> {/* empty corner */}
            {DAY_HEADERS.map((d) => <div key={d} className={styles.calendarDayHeader}>{d}</div>)}
            <div /> {/* empty corner for totals */}

            {calendarData.weeks.map((week, wi) => (
              <>
                <div key={`wl-${wi}`} className={styles.calendarWeekLabel}>W{wi + 1}</div>
                {week.map((cell, ci) => {
                  if (!cell) return <div key={`${wi}-${ci}`} className={`${styles.calendarCell} ${styles.calendarCellOutside}`} />;
                  const bgOpacity = cell.count === 0 ? 0 : cell.r > 0 ? Math.min(0.7, 0.2 + Math.abs(cell.r) * 0.15) : Math.min(0.8, 0.2 + Math.abs(cell.r) * 0.25);
                  const bgColor = cell.count === 0 ? 'transparent' : cell.r >= 0 ? `rgba(34, 197, 94, ${bgOpacity})` : `rgba(239, 68, 68, ${bgOpacity})`;
                  return (
                    <div key={`${wi}-${ci}`} className={`${styles.calendarCell} ${cell.count === 0 ? styles.calendarCellEmpty : ''} ${cell.isToday ? styles.calendarCellToday : ''}`} style={{ backgroundColor: bgColor }} title={`${MONTH_NAMES[calMonth.month]} ${cell.day} — ${cell.count} trade${cell.count !== 1 ? 's' : ''}, ${cell.r >= 0 ? '+' : ''}${cell.r}R`}>
                      <span className={styles.calendarDayNum}>{cell.day}</span>
                      {cell.count > 0 && <span className={styles.calendarCellR} style={{ color: cell.r >= 0 ? '#22c55e' : '#ef4444' }}>{cell.r >= 0 ? '+' : ''}{cell.r}R</span>}
                    </div>
                  );
                })}
                <div key={`wt-${wi}`} className={styles.calendarWeekTotal} style={{ color: calendarData.weekTotals[wi] >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {calendarData.weekTotals[wi] !== 0 ? `${calendarData.weekTotals[wi] >= 0 ? '+' : ''}${Math.round(calendarData.weekTotals[wi] * 100) / 100}R` : '—'}
                </div>
              </>
            ))}
          </div>

          <div className={styles.calendarSummary}>
            <div className={styles.calendarSumCard}><div className={styles.calendarSumLabel}>Trades</div><div className={styles.calendarSumValue}>{calendarData.totalTrades}</div></div>
            <div className={styles.calendarSumCard}><div className={styles.calendarSumLabel}>Win Days</div><div className={styles.calendarSumValue} style={{ color: 'var(--success)' }}>{calendarData.winDays}</div></div>
            <div className={styles.calendarSumCard}><div className={styles.calendarSumLabel}>Loss Days</div><div className={styles.calendarSumValue} style={{ color: 'var(--danger)' }}>{calendarData.lossDays}</div></div>
            <div className={styles.calendarSumCard}><div className={styles.calendarSumLabel}>Best Day</div><div className={styles.calendarSumValue} style={{ color: 'var(--success)' }}>{calendarData.bestDay > 0 ? `+${calendarData.bestDay}R` : '—'}</div></div>
            <div className={styles.calendarSumCard}><div className={styles.calendarSumLabel}>Worst Day</div><div className={styles.calendarSumValue} style={{ color: 'var(--danger)' }}>{calendarData.worstDay < 0 ? `${calendarData.worstDay}R` : '—'}</div></div>
          </div>
        </div>
      </div>

      {/* ─── Diversification (4 charts) ─── */}
      <div className={styles.pieSection}>
        <div className={styles.pieSectionTitle}>{'// DIVERSIFICATION'}</div>
        <div className={styles.pieGrid}>
          <PieChartCard title="By Firm" data={firmPieData} valueLabel={(d) => `${d.value} acct${d.value !== 1 ? 's' : ''}`} />
          <PieChartCard title="By Model" data={modelPieData} valueLabel={(d) => `${d.value} acct${d.value !== 1 ? 's' : ''}`} />
          <PieChartCard title="By Session" data={sessionPieData} valueLabel={(d) => `${d.value} trade${d.value !== 1 ? 's' : ''}`} />
          <PieChartCard title="By Asset" data={assetPieData} valueLabel={(d) => `${d.value} trade${d.value !== 1 ? 's' : ''}`} />
        </div>
      </div>

      {/* ─── Performance Ratios ─── */}
      <div className={styles.perfSection}>
        <div className={styles.pieSectionTitle}>{'// PERFORMANCE BREAKDOWN'}</div>
        <div className={styles.perfGrid}>
          <div className={styles.perfCard}>
            <div className={styles.perfLabel}>Profit Factor</div>
            <div className={styles.perfValue} style={{ color: pfColor }}>{perfRatios?.profitFactor === Infinity ? '∞' : perfRatios?.profitFactor.toFixed(2) || '0'}</div>
            <div className={styles.perfSub}>gross win / gross loss</div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfLabel}>Expectancy</div>
            <div className={styles.perfValue} style={{ color: (perfRatios?.expectancyPerTrade || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{(perfRatios?.expectancyPerTrade || 0) >= 0 ? '+' : ''}{perfRatios?.expectancyPerTrade || 0}R</div>
            <div className={styles.perfSub}>expected R per trade</div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfLabel}>Best Month</div>
            <div className={styles.perfValue} style={{ color: 'var(--success)' }}>{perfRatios?.bestMonthLabel || '—'}</div>
            <div className={styles.perfSub}>{perfRatios && perfRatios.bestMonthR > 0 ? `+${perfRatios.bestMonthR}R` : 'no data'}</div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfLabel}>Consistency</div>
            <div className={styles.perfValue} style={{ color: csColor }}>{perfRatios?.consistencyScore || 0}%</div>
            <div className={styles.perfSub}>profitable days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
