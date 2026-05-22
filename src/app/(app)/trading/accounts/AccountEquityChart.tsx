'use client';

// Per-account equity-curve chart, split into its own chunk so recharts is
// lazy-loaded (next/dynamic, ssr:false) instead of bundled into First Load JS.
// gradientId must be unique per rendered chart (callers pass `grad-${account.id}`).
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

export default function AccountEquityChart({
  data,
  r,
  gradientId,
}: {
  data: REquityCurvePoint[];
  r: number;
  gradientId: string;
}) {
  const color = r >= 0 ? '#3b82f6' : '#ef4444';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
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
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
