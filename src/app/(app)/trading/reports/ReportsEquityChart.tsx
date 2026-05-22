'use client';

// Equity-curve chart for the reports page, split into its own chunk so recharts
// is lazy-loaded (next/dynamic, ssr:false) rather than bundled into First Load JS.
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { REquityCurvePoint } from '@/lib/types';

export default function ReportsEquityChart({ data }: { data: REquityCurvePoint[] }) {
  const lastR = data.length > 0 ? data[data.length - 1].cumulativeR : 0;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
            stroke: '#FFFFFF',
            strokeWidth: 2,
            fill: lastR >= 0 ? '#3b82f6' : '#ef4444',
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
