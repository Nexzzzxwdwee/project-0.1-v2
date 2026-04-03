'use client';

import { useState, useEffect } from 'react';
import { generateId, getTodayDateString, getTransactions, saveTransactions } from '@/lib/presets';
import type { Transaction } from '@/lib/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import styles from './earnings.module.css';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatMonth = (date: Date): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

type Currency = 'GBP' | 'USD' | 'EUR' | 'JPY' | 'CAD';

const formatMoney = (amount: number, currency: Currency, showDecimals = false): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

export default function EarningsPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [baseCurrency, setBaseCurrency] = useState<Currency>('GBP');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCurrency, setEntryCurrency] = useState<Currency>('GBP');
  const [entryDate, setEntryDate] = useState(getTodayDateString());
  const [entryTag, setEntryTag] = useState('');
  const [entryNote, setEntryNote] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load transactions on mount
  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await getTransactions();
        setTransactions(loaded);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    };
    load();
  }, []);

  const updateTransactions = async (updated: Transaction[]) => {
    setTransactions(updated);
    try {
      await saveTransactions(updated);
    } catch (error) {
      console.error('Failed to save transactions:', error);
    }
  };

  const filteredTransactions = selectedTag
    ? transactions.filter((t) => t.tag === selectedTag)
    : transactions;

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netPnL = totalIncome - totalExpenses;

  const incomeCount = filteredTransactions.filter((t) => t.type === 'income').length;
  const expenseCount = filteredTransactions.filter((t) => t.type === 'expense').length;

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(entryAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newTransaction: Transaction = {
      id: generateId(),
      date: entryDate,
      type: entryType,
      amount,
      currency: entryCurrency,
      tag: entryTag || 'Other',
      description: `${entryType === 'income' ? 'Income' : 'Expense'}: ${entryTag || 'Other'}`,
      note: entryNote || undefined,
      createdAt: Date.now(),
    };

    await updateTransactions([newTransaction, ...transactions]);

    setEntryAmount('');
    setEntryTag('');
    setEntryNote('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await updateTransactions(transactions.filter((t) => t.id !== deleteId));
    }
    setDeleteId(null);
  };

  const availableTags = Array.from(new Set(transactions.map((t) => t.tag)));

  return (
    <div className={styles.page}>
      <ConfirmModal
        open={deleteId !== null}
        title="Delete transaction"
        message="Delete this transaction? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
      <div className={styles.bgGrid}></div>
      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.titleAccent}>// FINANCIAL OPS</span>
            <h1 className={styles.title}><span className={styles.titleGradient}>Earnings</span></h1>
            <p className={styles.subtitle}>Track income, expenses, and net outcome.</p>
          </div>

          {/* Date Range & Currency Selector */}
          <div className={styles.headerControls}>
            <div className={styles.controlGroup}>
              <label htmlFor="month-nav" className={styles.controlLabel}>Period</label>
              <div className={styles.monthSelector}>
                <button
                  type="button"
                  className={styles.monthButton}
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
                    <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
                  </svg>
                </button>
                <span className={styles.monthDisplay}>{formatMonth(currentMonth)}</span>
                <button
                  type="button"
                  className={styles.monthButton}
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
                    <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <label htmlFor="currency-select" className={styles.controlLabel}>Base Currency</label>
              <select
                id="currency-select"
                className={styles.currencySelect}
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value as Currency)}
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
                <option>CAD</option>
              </select>
            </div>
          </div>
        </header>

        {/* Summary Row */}
        <section className={styles.section}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Income</span>
              <div className={styles.summaryValue}>
                <span className={styles.summaryAmount}>{formatMoney(totalIncome, baseCurrency)}</span>
              </div>
              <div className={styles.summaryCount}>{incomeCount} entries</div>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Expenses</span>
              <div className={styles.summaryValue}>
                <span className={styles.summaryAmount}>{formatMoney(totalExpenses, baseCurrency)}</span>
              </div>
              <div className={styles.summaryCount}>{expenseCount} entries</div>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Net PnL</span>
              <div className={styles.summaryValue}>
                <span className={`${styles.summaryAmount} ${netPnL >= 0 ? styles.summaryAmountPositive : ''}`}>
                  {netPnL >= 0 ? '+' : '-'}{formatMoney(Math.abs(netPnL), baseCurrency)}
                </span>
              </div>
              <div className={`${styles.summaryCount} ${netPnL >= 0 ? styles.summaryCountPositive : ''}`}>
                {netPnL >= 0 ? 'Positive' : 'Negative'}
              </div>
            </div>
          </div>
        </section>

        {/* Add Entry Form */}
        <section className={styles.section}>
          <div className={styles.addEntryCard}>
            <h2 className={styles.addEntryTitle}>Add Entry</h2>

            <form onSubmit={handleAddEntry} className={styles.addEntryForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Type</label>
                <div className={styles.typeButtons}>
                  <button
                    type="button"
                    className={`${styles.typeButton} ${entryType === 'income' ? styles.typeButtonActive : ''}`}
                    onClick={() => setEntryType('income')}
                    data-type="income"
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeButton} ${entryType === 'expense' ? styles.typeButtonActiveExpense : ''}`}
                    onClick={() => setEntryType('expense')}
                    data-type="expense"
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
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  step="0.01"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="entry-currency" className={styles.fieldLabel}>Currency</label>
                  <select
                    id="entry-currency"
                    className={styles.formSelect}
                    value={entryCurrency}
                    onChange={(e) => setEntryCurrency(e.target.value as Currency)}
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>JPY</option>
                    <option>CAD</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="entry-date" className={styles.fieldLabel}>Date</label>
                  <input
                    type="date"
                    id="entry-date"
                    className={styles.formInput}
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="entry-tag" className={styles.fieldLabel}>Tag</label>
                <input
                  type="text"
                  id="entry-tag"
                  className={styles.formInput}
                  placeholder="Type a tag..."
                  value={entryTag}
                  onChange={(e) => setEntryTag(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="entry-note" className={styles.fieldLabel}>Note</label>
                <input
                  type="text"
                  id="entry-note"
                  className={styles.formInput}
                  placeholder="Optional note..."
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                Add Entry
              </button>
            </form>
          </div>
        </section>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <section className={styles.section}>
            <div className={styles.tagFilters}>
              <button
                type="button"
                className={`${styles.tagFilter} ${selectedTag === null ? styles.tagFilterActive : ''}`}
                onClick={() => setSelectedTag(null)}
              >
                All
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tagFilter} ${selectedTag === tag ? styles.tagFilterActive : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Transaction Log */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Transaction Log</h2>

          {filteredTransactions.length === 0 ? (
            <p style={{ color: '#78716c', textAlign: 'center', padding: '2rem 0' }}>
              No transactions yet. Add your first entry above.
            </p>
          ) : (
            <div className={styles.transactionList}>
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className={styles.transactionItem}>
                  <div className={styles.transactionLeft}>
                    <div className={styles.transactionDateGroup}>
                      <span className={styles.transactionDate}>{formatDate(transaction.date)}</span>
                      <span className={styles.transactionTag}>{transaction.tag}</span>
                    </div>
                    <div className={styles.transactionDetails}>
                      <p className={styles.transactionDescription}>{transaction.description}</p>
                      {transaction.note && (
                        <p className={styles.transactionNote}>{transaction.note}</p>
                      )}
                    </div>
                  </div>
                  <div className={styles.transactionRight}>
                    <div className={styles.transactionAmount}>
                      <span
                        className={`${styles.transactionAmountValue} ${transaction.type === 'income' ? styles.transactionAmountIncome : ''}`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}{formatMoney(Math.abs(transaction.amount), transaction.currency as Currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      aria-label={`Delete transaction: ${transaction.description}`}
                      onClick={() => setDeleteId(transaction.id)}
                    >
                      <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
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
