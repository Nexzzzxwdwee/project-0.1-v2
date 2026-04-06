/**
 * Trading Hub — Service Layer
 * All trading CRUD and analytics queries against Supabase.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type {
  TradingAccount,
  Trade,
  TradeFilters,
  REquityCurvePoint,
  DCABudget,
  DCAPlanEntry,
  DayOfWeek,
  DCAFrequency,
  DCACurrency,
} from '@/lib/types';

// ── Helpers ──────────────────────────────────────────────────

function supabase() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error('Supabase client not configured');
  return client;
}

function toAccount(row: any): TradingAccount {
  return {
    id: row.id,
    userId: row.user_id,
    firm: row.firm,
    size: row.size,
    stage: row.stage,
    model: row.model,
    asset: row.asset,
    status: row.status,
    maxAllocation: row.max_allocation,
    createdAt: row.created_at,
  };
}

function toTrade(row: any): Trade {
  return {
    id: row.id,
    userId: row.user_id,
    accountIds: row.account_ids || [],
    date: row.date,
    month: row.month,
    asset: row.asset,
    assetClass: row.asset_class || 'Futures',
    model: row.model,
    time: row.time,
    session: row.session,
    result: Number(row.result),
    bias: row.bias || null,
    rCounter: row.r_counter != null ? Number(row.r_counter) : null,
    tradingviewUrl: row.tradingview_url,
    biasUrl: row.bias_url,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/**
 * Parse account size strings like "10k", "50K", "100000", "150k" into numbers.
 * Handles k/K suffix and plain numbers.
 */
export function parseSize(size: string): number {
  const trimmed = size.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*k$/);
  if (match) return Number(match[1]) * 1000;
  const num = Number(trimmed.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

// ── Accounts ─────────────────────────────────────────────────

export async function getAccounts(userId: string): Promise<TradingAccount[]> {
  const { data, error } = await supabase()
    .from('trading_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toAccount);
}

export async function createAccount(
  account: Omit<TradingAccount, 'id' | 'createdAt'>
): Promise<TradingAccount> {
  const { data, error } = await supabase()
    .from('trading_accounts')
    .insert({
      user_id: account.userId,
      firm: account.firm,
      size: account.size,
      stage: account.stage,
      model: account.model,
      asset: account.asset,
      status: account.status,
      max_allocation: account.maxAllocation,
    })
    .select()
    .single();

  if (error) throw error;
  return toAccount(data);
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<TradingAccount, 'id' | 'userId' | 'createdAt'>>
): Promise<TradingAccount> {
  const row: Record<string, unknown> = {};
  if (updates.firm !== undefined) row.firm = updates.firm;
  if (updates.size !== undefined) row.size = updates.size;
  if (updates.stage !== undefined) row.stage = updates.stage;
  if (updates.model !== undefined) row.model = updates.model;
  if (updates.asset !== undefined) row.asset = updates.asset;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.maxAllocation !== undefined) row.max_allocation = updates.maxAllocation;

  const { data, error } = await supabase()
    .from('trading_accounts')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toAccount(data);
}

// ── Trades ───────────────────────────────────────────────────

export async function getTrades(
  userId: string,
  filters?: TradeFilters
): Promise<Trade[]> {
  let query = supabase()
    .from('trades')
    .select('*')
    .eq('user_id', userId);

  if (filters?.accountId) query = query.contains('account_ids', [filters.accountId]);
  if (filters?.session) query = query.eq('session', filters.session);
  if (filters?.asset) query = query.eq('asset', filters.asset);
  if (filters?.model) query = query.eq('model', filters.model);
  if (filters?.month) query = query.eq('month', filters.month);
  if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('date', filters.dateTo);

  const { data, error } = await query.order('date', { ascending: true });

  if (error) throw error;
  return (data || []).map(toTrade);
}

export async function createTrade(
  trade: Omit<Trade, 'id' | 'createdAt'>
): Promise<Trade> {
  const { data, error } = await supabase()
    .from('trades')
    .insert({
      user_id: trade.userId,
      account_ids: trade.accountIds,
      date: trade.date,
      month: trade.month,
      asset: trade.asset,
      asset_class: trade.assetClass,
      model: trade.model,
      time: trade.time,
      session: trade.session,
      result: trade.result,
      bias: trade.bias,
      r_counter: trade.rCounter,
      tradingview_url: trade.tradingviewUrl,
      bias_url: trade.biasUrl,
      notes: trade.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return toTrade(data);
}

export async function updateTrade(
  id: string,
  updates: Partial<Omit<Trade, 'id' | 'userId' | 'createdAt'>>
): Promise<Trade> {
  const row: Record<string, unknown> = {};
  if (updates.accountIds !== undefined) row.account_ids = updates.accountIds;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.month !== undefined) row.month = updates.month;
  if (updates.asset !== undefined) row.asset = updates.asset;
  if (updates.assetClass !== undefined) row.asset_class = updates.assetClass;
  if (updates.model !== undefined) row.model = updates.model;
  if (updates.time !== undefined) row.time = updates.time;
  if (updates.session !== undefined) row.session = updates.session;
  if (updates.result !== undefined) row.result = updates.result;
  if (updates.bias !== undefined) row.bias = updates.bias;
  if (updates.rCounter !== undefined) row.r_counter = updates.rCounter;
  if (updates.tradingviewUrl !== undefined) row.tradingview_url = updates.tradingviewUrl;
  if (updates.biasUrl !== undefined) row.bias_url = updates.biasUrl;
  if (updates.notes !== undefined) row.notes = updates.notes;

  const { data, error } = await supabase()
    .from('trades')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toTrade(data);
}

export async function deleteTrade(id: string): Promise<void> {
  const { error } = await supabase()
    .from('trades')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Analytics ────────────────────────────────────────────────

export async function getEquityCurve(
  userId: string,
  accountId?: string
): Promise<REquityCurvePoint[]> {
  let query = supabase()
    .from('trades')
    .select('date, result, account_ids')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (accountId) query = query.contains('account_ids', [accountId]);

  const { data, error } = await query;
  if (error) throw error;

  let cumulative = 0;
  return (data || []).map((row: any, i: number) => {
    cumulative += Number(row.result);
    return {
      date: row.date,
      cumulativeR: cumulative,
      tradeNumber: i + 1,
    };
  });
}

interface StatRow {
  label: string;
  totalR: number;
  count: number;
  wins: number;
  losses: number;
}

function aggregateBy(trades: Trade[], keyFn: (t: Trade) => string): StatRow[] {
  const map = new Map<string, StatRow>();
  for (const t of trades) {
    const key = keyFn(t);
    let row = map.get(key);
    if (!row) {
      row = { label: key, totalR: 0, count: 0, wins: 0, losses: 0 };
      map.set(key, row);
    }
    row.totalR += t.result;
    row.count++;
    if (t.result > 0) row.wins++;
    if (t.result < 0) row.losses++;
  }
  return Array.from(map.values());
}

export async function getMonthlyStats(userId: string): Promise<StatRow[]> {
  const trades = await getTrades(userId);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const rows = aggregateBy(trades, (t) => t.month);
  rows.sort((a, b) => months.indexOf(a.label) - months.indexOf(b.label));
  return rows;
}

export async function getSessionStats(userId: string): Promise<StatRow[]> {
  const trades = await getTrades(userId);
  return aggregateBy(trades, (t) => t.session);
}

export async function getAssetStats(userId: string): Promise<StatRow[]> {
  const trades = await getTrades(userId);
  return aggregateBy(trades, (t) => t.asset);
}

export async function getModelStats(userId: string): Promise<StatRow[]> {
  const trades = await getTrades(userId);
  return aggregateBy(trades, (t) => t.model);
}

// ── Streak Stats ─────────────────────────────────────────────

export interface StreakStats {
  currentWinStreak: number;
  highestWinStreak: number;
  currentLossStreak: number;
  streakIsActive: boolean;
  streakBrokenDate: string | null;
}

export async function getStreakStats(userId: string): Promise<StreakStats> {
  const trades = await getTrades(userId);
  // trades are ordered by date ascending

  let highestWin = 0;
  let currentRun = 0;
  let currentRunType: 'win' | 'loss' | null = null;
  let currentWin = 0;
  let currentLoss = 0;
  let streakBrokenDate: string | null = null;

  for (const t of trades) {
    const isWin = t.result > 0;
    if (isWin) {
      if (currentRunType === 'win') {
        currentRun++;
      } else {
        currentRun = 1;
        currentRunType = 'win';
      }
      if (currentRun > highestWin) highestWin = currentRun;
    } else {
      if (currentRunType === 'loss') {
        currentRun++;
      } else {
        if (currentRunType === 'win') {
          streakBrokenDate = t.date;
        }
        currentRun = 1;
        currentRunType = 'loss';
      }
    }
  }

  if (currentRunType === 'win') {
    currentWin = currentRun;
  } else if (currentRunType === 'loss') {
    currentLoss = currentRun;
  }

  return {
    currentWinStreak: currentWin,
    highestWinStreak: highestWin,
    currentLossStreak: currentLoss,
    streakIsActive: currentRunType === 'win',
    streakBrokenDate,
  };
}

// ── Performance Ratios ───────────────────────────────────────

export interface PerformanceRatios {
  profitFactor: number;
  expectancyPerTrade: number;
  avgWin: number;
  avgLoss: number;
  bestMonthLabel: string;
  bestMonthR: number;
  consistencyScore: number; // % of trading days profitable
}

export async function getPerformanceRatios(userId: string): Promise<PerformanceRatios> {
  const trades = await getTrades(userId);

  const wins = trades.filter((t) => t.result > 0);
  const losses = trades.filter((t) => t.result <= 0);

  const grossWin = wins.reduce((s, t) => s + t.result, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.result, 0));

  const avgWin = wins.length > 0 ? Math.round((grossWin / wins.length) * 100) / 100 : 0;
  const avgLoss = losses.length > 0 ? Math.round((grossLoss / losses.length) * 100) / 100 : 0;

  const profitFactor = grossLoss > 0 ? Math.round((grossWin / grossLoss) * 100) / 100 : grossWin > 0 ? Infinity : 0;

  const winRate = trades.length > 0 ? wins.length / trades.length : 0;
  const lossRate = 1 - winRate;
  const expectancyPerTrade = trades.length > 0
    ? Math.round((winRate * avgWin - lossRate * avgLoss) * 100) / 100
    : 0;

  // Best month
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];
  const monthMap = new Map<string, number>();
  for (const t of trades) {
    monthMap.set(t.month, (monthMap.get(t.month) || 0) + t.result);
  }
  let bestMonthLabel = '—';
  let bestMonthR = 0;
  for (const [m, r] of monthMap) {
    if (r > bestMonthR) {
      bestMonthR = Math.round(r * 100) / 100;
      bestMonthLabel = m;
    }
  }

  // Consistency: % of unique trading days that were net positive
  const dayMap = new Map<string, number>();
  for (const t of trades) {
    dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.result);
  }
  const tradingDays = dayMap.size;
  const profitableDays = Array.from(dayMap.values()).filter((r) => r > 0).length;
  const consistencyScore = tradingDays > 0 ? Math.round((profitableDays / tradingDays) * 100) : 0;

  return {
    profitFactor,
    expectancyPerTrade,
    avgWin,
    avgLoss,
    bestMonthLabel,
    bestMonthR,
    consistencyScore,
  };
}

// ── DCA Plan ─────────────────────────────────────────────────

export async function getDCABudget(userId: string): Promise<DCABudget | null> {
  const { data, error } = await supabase()
    .from('dca_budget')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    budgetAmount: Number(data.budget_amount),
    currency: data.currency,
    updatedAt: data.updated_at,
  };
}

export async function saveDCABudget(
  userId: string,
  amount: number,
  currency: DCACurrency
): Promise<DCABudget> {
  const { data, error } = await supabase()
    .from('dca_budget')
    .upsert(
      {
        user_id: userId,
        budget_amount: amount,
        currency,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    budgetAmount: Number(data.budget_amount),
    currency: data.currency,
    updatedAt: data.updated_at,
  };
}

export async function getDCAPlanEntries(userId: string): Promise<DCAPlanEntry[]> {
  const { data, error } = await supabase()
    .from('dca_plan_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    dayOfWeek: row.day_of_week,
    firm: row.firm,
    accountSize: row.account_size,
    costUsd: Number(row.cost_usd),
    frequency: row.frequency,
    createdAt: row.created_at,
  }));
}

export async function addDCAPlanEntry(
  userId: string,
  data: {
    dayOfWeek: DayOfWeek;
    firm: string;
    accountSize: string;
    costUsd: number;
    frequency: DCAFrequency;
  }
): Promise<DCAPlanEntry> {
  const { data: row, error } = await supabase()
    .from('dca_plan_entries')
    .insert({
      user_id: userId,
      day_of_week: data.dayOfWeek,
      firm: data.firm,
      account_size: data.accountSize,
      cost_usd: data.costUsd,
      frequency: data.frequency,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: row.id,
    userId: row.user_id,
    dayOfWeek: row.day_of_week,
    firm: row.firm,
    accountSize: row.account_size,
    costUsd: Number(row.cost_usd),
    frequency: row.frequency,
    createdAt: row.created_at,
  };
}

export async function removeDCAPlanEntry(entryId: string): Promise<void> {
  const { error } = await supabase()
    .from('dca_plan_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}
