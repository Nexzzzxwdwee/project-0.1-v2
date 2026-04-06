/**
 * Shared domain types
 */

export interface JournalEntry {
  id: string;
  createdAt: number;
  updatedAt: number;
  date: string; // YYYY-MM-DD
  content: string;
}

export interface Goal {
  id: string;
  text: string;
  tag?: string;
  createdAt: number;
  updatedAt: number;
  done: boolean;
  doneAt: number | null;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  tag: string;
  description: string;
  note?: string;
  createdAt: number;
}

// ── Trading Hub ──────────────────────────────────────────────

export interface TradingAccount {
  id: string;
  userId: string;
  firm: string;
  size: string;
  stage: string;
  model: string;
  asset: string;
  status: 'active' | 'passed' | 'blown' | 'limbo';
  maxAllocation: number | null;
  createdAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountIds: string[];
  date: string; // YYYY-MM-DD
  month: string; // e.g. "Jan", "Feb"
  asset: string;
  assetClass: 'Forex' | 'Futures';
  model: string;
  time: string | null;
  session: 'LDN' | 'NY';
  result: number; // R value
  bias: 'Bullish' | 'Bearish' | null;
  rCounter: number | null; // running R total
  tradingviewUrl: string | null;
  biasUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TradeFilters {
  dateFrom?: string;
  dateTo?: string;
  session?: 'LDN' | 'NY';
  asset?: string;
  model?: string;
  accountId?: string;
  month?: string;
}

export interface REquityCurvePoint {
  date: string;
  cumulativeR: number;
  tradeNumber: number;
}

// ── DCA Plan ─────────────────────────────────────────────────

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type DCAFrequency = 'weekly' | 'biweekly' | 'monthly';
export type DCACurrency = 'GBP' | 'USD';

export interface DCABudget {
  id: string;
  userId: string;
  budgetAmount: number;
  currency: DCACurrency;
  updatedAt: string;
}

export interface DCAPlanEntry {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  firm: string;
  accountSize: string;
  costUsd: number;
  frequency: DCAFrequency;
  createdAt: string;
}
