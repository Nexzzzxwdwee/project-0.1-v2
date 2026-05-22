'use client';

// Recharts-using pieces of the dashboard, split into their own chunk so the
// (heavy) recharts library is lazy-loaded via next/dynamic instead of shipping
// in the route's First Load JS. Imported with { ssr: false } from page.tsx.
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
import type { REquityCurvePoint } from '@/lib/types';
import styles from './dashboard.module.css';

const PIE_COLORS = ['#E0002B', '#FF1744', '#6366f1', '#475569', '#8B0000', '#a00020', '#334155', '#ff708a'];
// Local copy — page.tsx keeps its own MONTH_NAMES for the calendar heatmap.
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface PieSlice { name: string; value: number; }

export function PieChartCard({ title, data, valueLabel }: { title: string; data: PieSlice[]; valueLabel?: (v: PieSlice) => string }) {
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

export function EquityCurveChart({ data }: { data: REquityCurvePoint[] }) {
  const lastR = data[data.length - 1]?.cumulativeR ?? 0;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="curvePos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
          <linearGradient id="curveNeg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={{ stroke: '#1e1e1e' }} tickLine={false} tickFormatter={(v: string) => { const d = new Date(v + 'T00:00:00'); return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`; }} />
        <YAxis tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={{ stroke: '#1e1e1e' }} tickLine={false} tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}R`} />
        <ReferenceLine y={0} stroke="#1e1e1e" strokeDasharray="3 3" />
        <Tooltip contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '6px', color: '#f5f5f5', fontFamily: 'var(--font-mono), monospace', fontSize: '0.625rem' }} formatter={(value) => [`${value}R`, 'Cumulative R']} labelFormatter={(label) => { const d = new Date(label + 'T00:00:00'); return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }} />
        <Area type="monotone" dataKey="cumulativeR" stroke={lastR >= 0 ? '#3b82f6' : '#ef4444'} strokeWidth={2} fill={lastR >= 0 ? 'url(#curvePos)' : 'url(#curveNeg)'} dot={false} activeDot={{ r: 4, stroke: '#f5f5f5', strokeWidth: 2, fill: lastR >= 0 ? '#3b82f6' : '#ef4444' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
