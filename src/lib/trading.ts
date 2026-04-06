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
    accountId: row.account_id,
    date: row.date,
    month: row.month,
    asset: row.asset,
    model: row.model,
    time: row.time,
    session: row.session,
    result: Number(row.result),
    bias: row.bias != null ? Number(row.bias) : null,
    rCounter: row.r_counter != null ? Number(row.r_counter) : null,
    tradingviewUrl: row.tradingview_url,
    biasUrl: row.bias_url,
    notes: row.notes,
    createdAt: row.created_at,
  };
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

  if (filters?.accountId) query = query.eq('account_id', filters.accountId);
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
      account_id: trade.accountId,
      date: trade.date,
      month: trade.month,
      asset: trade.asset,
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
  if (updates.accountId !== undefined) row.account_id = updates.accountId;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.month !== undefined) row.month = updates.month;
  if (updates.asset !== undefined) row.asset = updates.asset;
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
    .select('date, result')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (accountId) query = query.eq('account_id', accountId);

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
