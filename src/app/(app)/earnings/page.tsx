'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './earnings.module.css';
import { getStorage } from '@/lib/storage';
import type { Transaction } from '@/lib/storage/types';
import { onAuthReady } from '@/lib/supabase/browser';

/**
 * Test checklist:
 * - Add income/expense and see it in the list
 * - Totals update for all time + this month
 * - Delete a transaction and confirm persistence after reload
 */

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
};

const sortTransactions = (items: Transaction[]): Transaction[] => {
  return [...items].sort((a, b) => {
    if (a.date === b.date) {
      const aUpdated = a.updated_at ?? 0;
      const bUpdated = b.updated_at ?? 0;
      return bUpdated - aUpdated;
    }
    return a.date > b.date ? -1 : 1;
  });
};

export default function EarningsPage() {
  const isDev = process.env.NODE_ENV === 'development';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const storage = getStorage();
      const items = await storage.getTransactions();
      setTransactions(sortTransactions(items));
    } catch (err) {
      if (isDev) {
        console.error('[earnings-load]', err);
      }
      setError('Failed to load earnings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isDev]);

  useEffect(() => {
    let mounted = true;
    const guardedLoad = async () => {
      if (!mounted) return;
      await load();
    };
    guardedLoad();
    const unsubscribe = onAuthReady(() => {
      guardedLoad();
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [load]);

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const totalsAllTime = useMemo(() => {
    const income = transactions
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const totalsThisMonth = useMemo(() => {
    const filtered = transactions.filter((t) => t.date.startsWith(currentMonthKey));
    const income = filtered.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [transactions, currentMonthKey]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }

    const now = Date.now();
    const newItem: Transaction = {
      id: crypto.randomUUID(),
      kind,
      amount: parsedAmount,
      currency: 'GBP',
      category: category.trim(),
      note: note.trim() || undefined,
      date,
      created_at: now,
      updated_at: now,
    };

    const next = sortTransactions([newItem, ...transactions]);
    setSaving(true);
    try {
      const storage = getStorage();
      await storage.saveTransactions(next);
      setTransactions(next);
      setAmount('');
      setCategory('');
      setNote('');
    } catch (err) {
      if (isDev) {
        console.error('[earnings-save]', err);
      }
      setError('Failed to save transaction. Please try again. (details in console)');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const next = sortTransactions(transactions.filter((item) => item.id !== id));
    setSaving(true);
    try {
      const storage = getStorage();
      await storage.saveTransactions(next);
      setTransactions(next);
    } catch (err) {
      if (isDev) {
        console.error('[earnings-delete]', err);
      }
      setError('Failed to delete transaction. Please try again. (details in console)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid}></div>
      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Earnings</h1>
            <p className={styles.subtitle}>Track income, expenses, and net outcome.</p>
          </div>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {/* Summary Row */}
        <section className={styles.section}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Income (All time)</span>
              <div className={styles.summaryValue}>
                <span className={styles.summaryAmount}>{formatMoney(totalsAllTime.income)}</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Expenses (All time)</span>
              <div className={styles.summaryValue}>
                <span className={styles.summaryAmount}>{formatMoney(totalsAllTime.expenses)}</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Net (All time)</span>
              <div className={styles.summaryValue}>
                <span className={`${styles.summaryAmount} ${totalsAllTime.net >= 0 ? styles.summaryAmountPositive : ''}`}>
                  {totalsAllTime.net >= 0 ? '+' : '-'}{formatMoney(Math.abs(totalsAllTime.net))}
                </span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Income (This month)</span>
              <div className={styles.summaryValue}>
                <span className={styles.summaryAmount}>{formatMoney(totalsThisMonth.income)}</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Expenses (This month)</span>
              <div className={styles.summaryValue}>
                <span className={styles.summaryAmount}>{formatMoney(totalsThisMonth.expenses)}</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Net (This month)</span>
              <div className={styles.summaryValue}>
                <span className={`${styles.summaryAmount} ${totalsThisMonth.net >= 0 ? styles.summaryAmountPositive : ''}`}>
                  {totalsThisMonth.net >= 0 ? '+' : '-'}{formatMoney(Math.abs(totalsThisMonth.net))}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Add Entry Form */}
        <section className={styles.section}>
          <div className={styles.addEntryCard}>
            <h2 className={styles.addEntryTitle}>Add Transaction</h2>

            <form onSubmit={handleAddEntry} className={styles.addEntryForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Kind</label>
                <div className={styles.typeButtons}>
                  <button
                    type="button"
                    className={`${styles.typeButton} ${kind === 'income' ? styles.typeButtonActive : ''}`}
                    onClick={() => setKind('income')}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeButton} ${kind === 'expense' ? styles.typeButtonActiveExpense : ''}`}
                    onClick={() => setKind('expense')}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="entry-amount" className={styles.fieldLabel}>Amount</label>
                <input
                  type="number"
                  id="entry-amount"
                  className={styles.amountInput}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  disabled={saving}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="entry-category" className={styles.fieldLabel}>Category</label>
                  <input
                    type="text"
                    id="entry-category"
                    className={styles.formInput}
                    placeholder="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="entry-date" className={styles.fieldLabel}>Date</label>
                  <input
                    type="date"
                    id="entry-date"
                    className={styles.formInput}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="entry-note" className={styles.fieldLabel}>Note</label>
                <input
                  type="text"
                  id="entry-note"
                  className={styles.formInput}
                  placeholder="Optional note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={saving}
                />
              </div>

              <button type="submit" className={styles.submitButton} disabled={saving}>
                {saving ? 'Saving...' : 'Add Entry'}
              </button>
            </form>
          </div>
        </section>

        {/* Transaction Log */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Transaction Log</h2>

          {loading ? (
            <div className={styles.loadingState}>Loading transactions...</div>
          ) : (
            <div className={styles.transactionList}>
              {transactions.length === 0 ? (
                <div className={styles.emptyState}>No transactions yet.</div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className={styles.transactionItem}>
                    <div className={styles.transactionLeft}>
                      <div className={styles.transactionDateGroup}>
                        <span className={styles.transactionDate}>{formatDate(transaction.date)}</span>
                        <span className={styles.transactionTag}>{transaction.category}</span>
                      </div>
                      <div className={styles.transactionDetails}>
                        <p className={styles.transactionDescription}>
                          {transaction.kind === 'income' ? 'Income' : 'Expense'}
                        </p>
                        {transaction.note && (
                          <p className={styles.transactionNote}>{transaction.note}</p>
                        )}
                      </div>
                    </div>
                    <div className={styles.transactionRight}>
                      <div className={styles.transactionAmount}>
                        <span
                          className={`${styles.transactionAmountValue} ${transaction.kind === 'income' ? styles.transactionAmountIncome : ''}`}
                        >
                          {transaction.kind === 'income' ? '+' : '-'}{formatMoney(Math.abs(transaction.amount))}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        aria-label={`Delete transaction on ${transaction.date}`}
                        onClick={() => handleDelete(transaction.id)}
                        disabled={saving}
                      >
                        <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                          <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerQuote}>&quot;Precision over emotion.&quot;</p>
        </div>
      </div>
    </div>
  );
}
