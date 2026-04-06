'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  getAccounts,
  getTrades,
  getEquityCurve,
} from '@/lib/trading';
import type { TradingAccount, Trade, REquityCurvePoint } from '@/lib/types';
import styles from './dashboard.module.css';

type TimeFilter = 'all' | 'month' | 'week';

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
  // week
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
      trades = trades.filter((t) => t.accountId === accountFilter);
    }

    const range = getDateRange(timeFilter);
    if (range.from) {
      trades = trades.filter((t) => t.date >= range.from!);
    }
    if (range.to) {
      trades = trades.filter((t) => t.date <= range.to!);
    }

    // Build curve from filtered trades
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

    // Accounts at risk: group trades by account, check running R
    const accountRTotals = new Map<string, number>();
    for (const t of allTrades) {
      accountRTotals.set(
        t.accountId,
        (accountRTotals.get(t.accountId) || 0) + t.result
      );
    }
    const atRisk = activeAccounts.filter((a) => {
      const r = accountRTotals.get(a.id) || 0;
      return r <= -3;
    });

    return {
      activeCount: activeAccounts.length,
      totalRMonth: Math.round(totalRMonth * 100) / 100,
      totalRAll: Math.round(totalRAll * 100) / 100,
      winRate,
      atRiskCount: atRisk.length,
    };
  }, [accounts, allTrades]);

  // Per-account running R totals for the side panel
  const accountRTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTrades) {
      map.set(t.accountId, (map.get(t.accountId) || 0) + t.result);
    }
    return map;
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
        <span className={styles.titleAccent}>{'// COMMAND CENTRE'}</span>
        <h1 className={styles.title}>
          Trading <span className={styles.titleGradient}>Dashboard</span>
        </h1>
      </header>

      {/* ─── Summary Cards ─── */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active Accounts</div>
          <div className={styles.summaryValue}>{stats.activeCount}</div>
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
                    tick={{ fill: '#57534e', fontSize: 11 }}
                    axisLine={{ stroke: '#292524' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#57534e', fontSize: 11 }}
                    axisLine={{ stroke: '#292524' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}R`}
                  />
                  <ReferenceLine y={0} stroke="#44403c" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(28, 25, 23, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.5rem',
                      color: '#e7e5e4',
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.75rem',
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
    </div>
  );
}
