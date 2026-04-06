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
} from '@/lib/trading';
import type { TradingAccount, Trade, REquityCurvePoint } from '@/lib/types';
import styles from './dashboard.module.css';

type TimeFilter = 'all' | 'month' | 'week';

const PIE_COLORS = [
  '#22c55e', '#f59e0b', '#475569', '#a3e635', '#d97706',
  '#64748b', '#16a34a', '#ea580c', '#334155', '#84cc16',
];

function getDateRange(filter: TimeFilter): { from?: string; to?: string } {
  if (filter === 'all') return {};
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  if (filter === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    return { from, to };
  }
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const from = new Date(now.getFullYear(), now.getMonth(), diff)
    .toISOString()
    .split('T')[0];
  return { from, to };
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const to = now.toISOString().split('T')[0];
  return { from, to };
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

interface PieSlice {
  name: string;
  value: number;
}

function PieChartCard({
  title,
  data,
  valueLabel,
}: {
  title: string;
  data: PieSlice[];
  valueLabel?: (v: PieSlice) => string;
}) {
  if (data.length === 0) {
    return (
      <div className={styles.pieCard}>
        <div className={styles.pieCardTitle}>{title}</div>
        <div className={styles.pieEmpty}>No data</div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={styles.pieCard}>
      <div className={styles.pieCardTitle}>{title}</div>
      <div className={styles.pieChartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid #262626',
                borderRadius: '0.375rem',
                color: '#d4d4d4',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.6875rem',
              }}
              formatter={(value, name) => {
                const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                return [`${pct}%`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.pieLegend}>
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const label = valueLabel ? valueLabel(d) : `${pct}%`;
          return (
            <div key={d.name} className={styles.pieLegendItem}>
              <span
                className={styles.pieLegendDot}
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              {d.name} ({label})
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TradingDashboard() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [equityCurve, setEquityCurve] = useState<REquityCurvePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const [accts, trades, curve] = await Promise.all([
        getAccounts(user.id),
        getTrades(user.id),
        getEquityCurve(user.id),
      ]);

      if (!mounted) return;
      setAccounts(accts);
      setAllTrades(trades);
      setEquityCurve(curve);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Filtered equity curve
  const filteredCurve = useMemo(() => {
    let trades = allTrades;

    if (accountFilter) {
      trades = trades.filter((t) => t.accountIds.includes(accountFilter));
    }

    const range = getDateRange(timeFilter);
    if (range.from) {
      trades = trades.filter((t) => t.date >= range.from!);
    }
    if (range.to) {
      trades = trades.filter((t) => t.date <= range.to!);
    }

    let cumulative = 0;
    return trades.map((t, i) => {
      cumulative += t.result;
      return {
        date: t.date,
        cumulativeR: Math.round(cumulative * 100) / 100,
        tradeNumber: i + 1,
      };
    });
  }, [allTrades, timeFilter, accountFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const activeAccounts = accounts.filter((a) => a.status === 'active');
    const monthRange = getMonthRange();
    const monthTrades = allTrades.filter(
      (t) => t.date >= monthRange.from && t.date <= monthRange.to
    );
    const totalRMonth = monthTrades.reduce((sum, t) => sum + t.result, 0);
    const totalRAll = allTrades.reduce((sum, t) => sum + t.result, 0);
    const wins = allTrades.filter((t) => t.result > 0).length;
    const winRate =
      allTrades.length > 0 ? Math.round((wins / allTrades.length) * 100) : 0;

    const accountRTotals = new Map<string, number>();
    for (const t of allTrades) {
      for (const aid of t.accountIds) {
        accountRTotals.set(aid, (accountRTotals.get(aid) || 0) + t.result);
      }
    }
    const atRisk = activeAccounts.filter((a) => {
      const r = accountRTotals.get(a.id) || 0;
      return r <= -3;
    });

    // Total funding from active accounts
    const totalFunding = activeAccounts.reduce(
      (sum, a) => sum + parseSize(a.size),
      0
    );

    return {
      activeCount: activeAccounts.length,
      totalRMonth: Math.round(totalRMonth * 100) / 100,
      totalRAll: Math.round(totalRAll * 100) / 100,
      winRate,
      atRiskCount: atRisk.length,
      totalFunding,
    };
  }, [accounts, allTrades]);

  // Per-account running R totals for the side panel
  const accountRTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTrades) {
      for (const aid of t.accountIds) {
        map.set(aid, (map.get(aid) || 0) + t.result);
      }
    }
    return map;
  }, [allTrades]);

  // Pie chart data — firm diversification (count of active accounts per firm)
  const firmPieData = useMemo((): PieSlice[] => {
    const active = accounts.filter((a) => a.status === 'active');
    const map = new Map<string, number>();
    for (const a of active) {
      map.set(a.firm, (map.get(a.firm) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  // Pie chart data — model diversification (count of active accounts per model)
  const modelPieData = useMemo((): PieSlice[] => {
    const active = accounts.filter((a) => a.status === 'active');
    const map = new Map<string, number>();
    for (const a of active) {
      map.set(a.model, (map.get(a.model) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  // Pie chart data — session diversification (count of trades per session)
  const sessionPieData = useMemo((): PieSlice[] => {
    const map = new Map<string, number>();
    for (const t of allTrades) {
      map.set(t.session, (map.get(t.session) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allTrades]);

  if (loading) {
    return (
      <div className={styles.loadingState}>Loading trading data...</div>
    );
  }

  const activeAccounts = accounts.filter((a) => a.status === 'active');

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return styles.badgeActive;
      case 'passed': return styles.badgePassed;
      case 'blown': return styles.badgeBlown;
      case 'limbo': return styles.badgeLimbo;
      default: return '';
    }
  };

  return (
    <div>
      {/* ─── Header ─── */}
      <header className={styles.header}>
        <div>
          <span className={styles.titleAccent}>{'// COMMAND CENTRE'}</span>
          <h1 className={styles.title}>
            Trading <span className={styles.titleGradient}>Dashboard</span>
          </h1>
        </div>
        <Link href="/trading/journal?mode=log" className={styles.logTradeBtn}>
          + Log Trade
        </Link>
      </header>

      {/* ─── Summary Cards ─── */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active Accounts</div>
          <div className={styles.summaryValue}>{stats.activeCount}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Funding</div>
          <div className={`${styles.summaryValue} ${styles.summaryValueGold}`}>
            {formatCurrency(stats.totalFunding)}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>R This Month</div>
          <div
            className={`${styles.summaryValue} ${stats.totalRMonth >= 0 ? styles.summaryValueGreen : styles.summaryValueRed}`}
          >
            {stats.totalRMonth >= 0 ? '+' : ''}
            {stats.totalRMonth}R
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>R All Time</div>
          <div
            className={`${styles.summaryValue} ${stats.totalRAll >= 0 ? styles.summaryValueGreen : styles.summaryValueRed}`}
          >
            {stats.totalRAll >= 0 ? '+' : ''}
            {stats.totalRAll}R
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Win Rate</div>
          <div className={styles.summaryValue}>{stats.winRate}%</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>At Risk</div>
          <div
            className={`${styles.summaryValue} ${stats.atRiskCount > 0 ? styles.summaryValueRed : styles.summaryValueGreen}`}
          >
            {stats.atRiskCount}
          </div>
        </div>
      </div>

      {/* ─── Main Grid ─── */}
      <div className={styles.mainGrid}>
        {/* Equity Curve */}
        <div className={styles.chartPanel}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>R Equity Curve</span>
            <div className={styles.chartFilters}>
              <button
                type="button"
                className={`${styles.chartFilterBtn} ${accountFilter === null ? styles.chartFilterBtnActive : ''}`}
                onClick={() => setAccountFilter(null)}
              >
                All
              </button>
              {accounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`${styles.chartFilterBtn} ${accountFilter === a.id ? styles.chartFilterBtnActive : ''}`}
                  onClick={() => setAccountFilter(a.id)}
                >
                  {a.firm} {a.size}
                </button>
              ))}
            </div>
            <div className={styles.chartFilters}>
              {(['all', 'month', 'week'] as TimeFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.chartFilterBtn} ${timeFilter === f ? styles.chartFilterBtnActive : ''}`}
                  onClick={() => setTimeFilter(f)}
                >
                  {f === 'all' ? 'All Time' : f === 'month' ? 'This Month' : 'This Week'}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.chartArea}>
            {filteredCurve.length === 0 ? (
              <div className={styles.chartEmpty}>No trades to display</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredCurve}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="curveGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="curveRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="tradeNumber"
                    tick={{ fill: '#404040', fontSize: 10 }}
                    axisLine={{ stroke: '#1a1a1a' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#404040', fontSize: 10 }}
                    axisLine={{ stroke: '#1a1a1a' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}R`}
                  />
                  <ReferenceLine y={0} stroke="#262626" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #262626',
                      borderRadius: '0.375rem',
                      color: '#d4d4d4',
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.6875rem',
                    }}
                    formatter={(value) => [`${value}R`, 'Cumulative R']}
                    labelFormatter={(label) => `Trade #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeR"
                    stroke={
                      filteredCurve[filteredCurve.length - 1]?.cumulativeR >= 0
                        ? '#22c55e'
                        : '#ef4444'
                    }
                    strokeWidth={2}
                    fill={
                      filteredCurve[filteredCurve.length - 1]?.cumulativeR >= 0
                        ? 'url(#curveGreen)'
                        : 'url(#curveRed)'
                    }
                    dot={false}
                    activeDot={{
                      r: 4,
                      stroke: '#e7e5e4',
                      strokeWidth: 2,
                      fill:
                        filteredCurve[filteredCurve.length - 1]?.cumulativeR >= 0
                          ? '#22c55e'
                          : '#ef4444',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Active Accounts */}
        <div className={styles.accountsPanel}>
          <div className={styles.accountsPanelTitle}>Active Accounts</div>
          {activeAccounts.length === 0 ? (
            <div className={styles.accountsEmpty}>
              No active accounts yet
            </div>
          ) : (
            activeAccounts.map((a) => {
              const r = Math.round((accountRTotals.get(a.id) || 0) * 100) / 100;
              return (
                <div key={a.id} className={styles.accountCard}>
                  <div className={styles.accountCardTop}>
                    <span className={styles.accountFirm}>
                      {a.firm} {a.size}
                    </span>
                    <span
                      className={`${styles.accountBadge} ${statusBadgeClass(a.status)}`}
                    >
                      {a.stage}
                    </span>
                  </div>
                  <div className={styles.accountMeta}>
                    <span>{a.model}</span>
                    <span>{a.asset}</span>
                    <span
                      className={styles.accountR}
                      style={{ color: r >= 0 ? '#4ade80' : '#ef4444' }}
                    >
                      {r >= 0 ? '+' : ''}
                      {r}R
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Diversification Pie Charts ─── */}
      <div className={styles.pieSection}>
        <div className={styles.pieSectionTitle}>Diversification</div>
        <div className={styles.pieGrid}>
          <PieChartCard
            title="By Firm"
            data={firmPieData}
            valueLabel={(d) => {
              const total = firmPieData.reduce((s, x) => s + x.value, 0);
              return `${d.value} acct${d.value !== 1 ? 's' : ''} · ${total > 0 ? Math.round((d.value / total) * 100) : 0}%`;
            }}
          />
          <PieChartCard
            title="By Model"
            data={modelPieData}
            valueLabel={(d) => {
              const total = modelPieData.reduce((s, x) => s + x.value, 0);
              return `${d.value} acct${d.value !== 1 ? 's' : ''} · ${total > 0 ? Math.round((d.value / total) * 100) : 0}%`;
            }}
          />
          <PieChartCard
            title="By Session"
            data={sessionPieData}
            valueLabel={(d) => {
              const total = sessionPieData.reduce((s, x) => s + x.value, 0);
              return `${d.value} trade${d.value !== 1 ? 's' : ''} · ${total > 0 ? Math.round((d.value / total) * 100) : 0}%`;
            }}
          />
        </div>
      </div>
    </div>
  );
}
