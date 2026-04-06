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
  getTrades,
  getEquityCurve,
  getMonthlyStats,
  getSessionStats,
  getAssetStats,
  getModelStats,
} from '@/lib/trading';
import type { Trade, REquityCurvePoint } from '@/lib/types';
import styles from './reports.module.css';

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

interface StatRow {
  label: string;
  totalR: number;
  count: number;
  wins: number;
  losses: number;
}

export default function TradingReports() {
  const [curve, setCurve] = useState<REquityCurvePoint[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<StatRow[]>([]);
  const [sessionStats, setSessionStats] = useState<StatRow[]>([]);
  const [assetStats, setAssetStats] = useState<StatRow[]>([]);
  const [modelStats, setModelStats] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const [c, trades, monthly, session, asset, model] = await Promise.all([
        getEquityCurve(user.id),
        getTrades(user.id),
        getMonthlyStats(user.id),
        getSessionStats(user.id),
        getAssetStats(user.id),
        getModelStats(user.id),
      ]);

      if (!mounted) return;
      setCurve(c);
      setAllTrades(trades);
      setMonthlyStats(monthly);
      setSessionStats(session);
      setAssetStats(asset);
      setModelStats(model);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Monthly breakdown by session: Month | LDN R | NY R | Total R
  const monthlyBySession = useMemo(() => {
    const map = new Map<string, { ldn: number; ny: number; total: number }>();
    for (const t of allTrades) {
      const row = map.get(t.month) || { ldn: 0, ny: 0, total: 0 };
      if (t.session === 'LDN') row.ldn += t.result;
      else row.ny += t.result;
      row.total += t.result;
      map.set(t.month, row);
    }
    return MONTHS
      .filter((m) => map.has(m))
      .map((m) => {
        const r = map.get(m)!;
        return {
          month: m,
          ldn: Math.round(r.ldn * 100) / 100,
          ny: Math.round(r.ny * 100) / 100,
          total: Math.round(r.total * 100) / 100,
        };
      });
  }, [allTrades]);

  // Monthly breakdown by asset class: Month | FX R | Futures R
  const monthlyByAssetClass = useMemo(() => {
    const map = new Map<string, { fx: number; futures: number }>();
    for (const t of allTrades) {
      const row = map.get(t.month) || { fx: 0, futures: 0 };
      if (t.assetClass === 'Forex') {
        row.fx += t.result;
      } else {
        row.futures += t.result;
      }
      map.set(t.month, row);
    }
    return MONTHS
      .filter((m) => map.has(m))
      .map((m) => {
        const r = map.get(m)!;
        return {
          month: m,
          fx: Math.round(r.fx * 100) / 100,
          futures: Math.round(r.futures * 100) / 100,
        };
      });
  }, [allTrades]);

  const rClass = (r: number) =>
    r > 0 ? styles.rPositive : r < 0 ? styles.rNegative : styles.rZero;

  const fmt = (r: number) => `${r >= 0 ? '+' : ''}${r}R`;

  const winRate = (row: StatRow) =>
    row.count > 0 ? Math.round((row.wins / row.count) * 100) : 0;

  const avgR = (row: StatRow) =>
    row.count > 0 ? Math.round((row.totalR / row.count) * 100) / 100 : 0;

  if (loading) {
    return <div className={styles.loadingState}>Loading reports...</div>;
  }

  if (allTrades.length === 0) {
    return (
      <div>
        <header className={styles.header}>
          <span className={styles.titleAccent}>{'// ANALYTICS'}</span>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Reports</span>
          </h1>
        </header>
        <div className={styles.emptyState}>No trade data yet. Log some trades to see analytics.</div>
      </div>
    );
  }

  const lastR = curve.length > 0 ? curve[curve.length - 1].cumulativeR : 0;

  return (
    <div>
      {/* ─── Header ─── */}
      <header className={styles.header}>
        <span className={styles.titleAccent}>{'// ANALYTICS'}</span>
        <h1 className={styles.title}>
          <span className={styles.titleGradient}>Reports</span>
        </h1>
      </header>

      {/* ─── R Equity Curve (full width) ─── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>R Equity Curve</div>
        <div className={styles.chartCard}>
          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={curve}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reportGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reportRed" x1="0" y1="0" x2="0" y2="1">
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
                  stroke={lastR >= 0 ? '#3b82f6' : '#ef4444'}
                  strokeWidth={2}
                  fill={lastR >= 0 ? 'url(#reportGreen)' : 'url(#reportRed)'}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: '#e7e5e4',
                    strokeWidth: 2,
                    fill: lastR >= 0 ? '#3b82f6' : '#ef4444',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Monthly Breakdown by Session ─── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Monthly Breakdown — by Session</div>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>LDN R</th>
                <th>NY R</th>
                <th>Total R</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBySession.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td className={rClass(row.ldn)}>{fmt(row.ldn)}</td>
                  <td className={rClass(row.ny)}>{fmt(row.ny)}</td>
                  <td className={rClass(row.total)}>{fmt(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Monthly Breakdown by Asset Class ─── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Monthly Breakdown — FX vs Futures</div>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>FX R</th>
                <th>Futures R</th>
              </tr>
            </thead>
            <tbody>
              {monthlyByAssetClass.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td className={rClass(row.fx)}>{fmt(row.fx)}</td>
                  <td className={rClass(row.futures)}>{fmt(row.futures)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Session / Asset / Model stats ─── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Session Stats</div>
        <div className={styles.statRow}>
          {sessionStats.map((row) => (
            <div key={row.label} className={styles.statCard}>
              <div className={styles.statLabel}>{row.label}</div>
              <div className={`${styles.statValue} ${rClass(row.totalR)}`}>
                {fmt(Math.round(row.totalR * 100) / 100)}
              </div>
              <div className={styles.statSub}>
                {winRate(row)}% win · {row.count} trades · avg {avgR(row)}R
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.tableGrid}>
          {/* Asset Stats */}
          <div>
            <div className={styles.sectionTitle}>R per Asset</div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Total R</th>
                    <th>Trades</th>
                    <th>Win %</th>
                    <th>Avg R</th>
                  </tr>
                </thead>
                <tbody>
                  {assetStats.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={rClass(row.totalR)}>
                        {fmt(Math.round(row.totalR * 100) / 100)}
                      </td>
                      <td>{row.count}</td>
                      <td>{winRate(row)}%</td>
                      <td className={rClass(avgR(row))}>
                        {avgR(row)}R
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Stats */}
          <div>
            <div className={styles.sectionTitle}>R per Model</div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Total R</th>
                    <th>Trades</th>
                    <th>Win %</th>
                    <th>Avg R</th>
                  </tr>
                </thead>
                <tbody>
                  {modelStats.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={rClass(row.totalR)}>
                        {fmt(Math.round(row.totalR * 100) / 100)}
                      </td>
                      <td>{row.count}</td>
                      <td>{winRate(row)}%</td>
                      <td className={rClass(avgR(row))}>
                        {avgR(row)}R
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
