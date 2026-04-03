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
