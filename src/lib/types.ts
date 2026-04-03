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
