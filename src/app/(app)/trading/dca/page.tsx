'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  getAccounts,
  getDCABudget,
  saveDCABudget,
  getDCAPlanEntries,
  addDCAPlanEntry,
  removeDCAPlanEntry,
} from '@/lib/trading';
import { EXCHANGE_RATE_USD_TO_GBP } from '@/lib/constants';
import type {
  TradingAccount,
  DCAPlanEntry,
  DCABudget,
  DayOfWeek,
  DCAFrequency,
  DCACurrency,
} from '@/lib/types';
import styles from './dca.module.css';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'MON' },
  { key: 'tuesday', label: 'TUE' },
  { key: 'wednesday', label: 'WED' },
  { key: 'thursday', label: 'THU' },
  { key: 'friday', label: 'FRI' },
  { key: 'saturday', label: 'SAT' },
  { key: 'sunday', label: 'SUN' },
];

const FREQ_LABELS: Record<DCAFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
};

const FREQ_MULTIPLIER: Record<DCAFrequency, number> = {
  weekly: 4,
  biweekly: 2,
  monthly: 1,
};

function toGbp(usd: number): number {
  return Math.round(usd * EXCHANGE_RATE_USD_TO_GBP * 100) / 100;
}

function toUsd(gbp: number): number {
  return Math.round((gbp / EXCHANGE_RATE_USD_TO_GBP) * 100) / 100;
}

function formatCost(usd: number, currency: DCACurrency): string {
  if (currency === 'USD') return `$${usd.toFixed(2)}`;
  return `£${toGbp(usd).toFixed(2)}`;
}

function formatBoth(usd: number): string {
  return `$${usd.toFixed(2)} / £${toGbp(usd).toFixed(2)}`;
}

function monthlyEquiv(usd: number, freq: DCAFrequency): number {
  return Math.round(usd * FREQ_MULTIPLIER[freq] * 100) / 100;
}

export default function DCAPage() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [entries, setEntries] = useState<DCAPlanEntry[]>([]);
  const [budget, setBudget] = useState<DCABudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Budget editing
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [currency, setCurrency] = useState<DCACurrency>('GBP');

  // View toggle
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  // Add modal
  const [addDay, setAddDay] = useState<DayOfWeek | null>(null);
  const [formFirm, setFormFirm] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formFreq, setFormFreq] = useState<DCAFrequency>('weekly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      setUserId(user.id);
      const [accts, b, e] = await Promise.all([
        getAccounts(user.id),
        getDCABudget(user.id),
        getDCAPlanEntries(user.id),
      ]);

      if (!mounted) return;
      setAccounts(accts);
      setBudget(b);
      setEntries(e);
      if (b) {
        setCurrency(b.currency);
      }
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Entries grouped by day
  const entriesByDay = useMemo(() => {
    const map = new Map<DayOfWeek, DCAPlanEntry[]>();
    for (const d of DAYS) map.set(d.key, []);
    for (const e of entries) {
      const arr = map.get(e.dayOfWeek);
      if (arr) arr.push(e);
    }
    return map;
  }, [entries]);

  // Total monthly cost in USD
  const totalMonthlyUsd = useMemo(() => {
    return entries.reduce(
      (sum, e) => sum + monthlyEquiv(e.costUsd, e.frequency),
      0
    );
  }, [entries]);

  // Budget amount in USD for comparison
  const budgetUsd = useMemo(() => {
    if (!budget) return 0;
    return budget.currency === 'USD'
      ? budget.budgetAmount
      : toUsd(budget.budgetAmount);
  }, [budget]);

  const budgetUsedPct = budgetUsd > 0 ? Math.min((totalMonthlyUsd / budgetUsd) * 100, 100) : 0;

  const progressColor = budgetUsedPct >= 100
    ? 'var(--danger)'
    : budgetUsedPct >= 80
      ? 'var(--warning)'
      : 'var(--accent)';

  // Budget actions
  const startEditBudget = () => {
    setBudgetDraft(budget ? String(budget.budgetAmount) : '0');
    setEditingBudget(true);
  };

  const confirmBudget = async () => {
    if (!userId) return;
    const amount = Math.max(0, Number(budgetDraft) || 0);
    const saved = await saveDCABudget(userId, amount, currency);
    setBudget(saved);
    setEditingBudget(false);
  };

  const toggleCurrency = async (c: DCACurrency) => {
    setCurrency(c);
    if (userId && budget) {
      // Convert existing budget to new currency
      let newAmount: number;
      if (c === budget.currency) {
        newAmount = budget.budgetAmount;
      } else if (c === 'GBP') {
        newAmount = toGbp(budget.budgetAmount);
      } else {
        newAmount = toUsd(budget.budgetAmount);
      }
      const saved = await saveDCABudget(userId, Math.round(newAmount * 100) / 100, c);
      setBudget(saved);
    }
  };

  // Add modal
  const openAddModal = (day: DayOfWeek) => {
    setAddDay(day);
    setFormFirm('');
    setFormSize('');
    setFormCost('');
    setFormFreq('weekly');
  };

  const handleAdd = async () => {
    if (!userId || !addDay || saving) return;
    const costUsd = Number(formCost) || 0;
    if (costUsd <= 0 || !formFirm || !formSize) return;

    setSaving(true);
    try {
      const entry = await addDCAPlanEntry(userId, {
        dayOfWeek: addDay,
        firm: formFirm,
        accountSize: formSize,
        costUsd,
        frequency: formFreq,
      });
      setEntries((prev) => [...prev, entry]);
      setAddDay(null);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (entryId: string) => {
    await removeDCAPlanEntry(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  // Unique firms from accounts for dropdown
  const firmOptions = useMemo(() => {
    const set = new Set(accounts.map((a) => a.firm));
    return Array.from(set).sort();
  }, [accounts]);

  const sizeOptions = useMemo(() => {
    const set = new Set(accounts.map((a) => a.size));
    return Array.from(set).sort();
  }, [accounts]);

  // Monthly view: group entries by firm, aggregate costs
  const monthlyRows = useMemo(() => {
    const map = new Map<string, { firm: string; entries: DCAPlanEntry[]; totalMonthlyUsd: number }>();
    for (const e of entries) {
      const key = `${e.firm}|${e.accountSize}`;
      const existing = map.get(key);
      const mo = monthlyEquiv(e.costUsd, e.frequency);
      if (existing) {
        existing.entries.push(e);
        existing.totalMonthlyUsd += mo;
      } else {
        map.set(key, {
          firm: `${e.firm} ${e.accountSize}`,
          entries: [e],
          totalMonthlyUsd: mo,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalMonthlyUsd - a.totalMonthlyUsd);
  }, [entries]);

  // Weekly totals per day for the monthly calendar view
  const weeklyTotalsByDay = useMemo(() => {
    return DAYS.map((day) => {
      const dayEntries = entriesByDay.get(day.key) || [];
      return {
        ...day,
        entries: dayEntries,
        weeklyUsd: dayEntries.reduce((s, e) => s + e.costUsd, 0),
      };
    });
  }, [entriesByDay]);

  const totalWeeklyUsd = useMemo(
    () => entries.reduce((s, e) => s + e.costUsd, 0),
    [entries]
  );

  if (loading) {
    return <div className={styles.loadingState}>Loading DCA plan...</div>;
  }

  const displayBudget = budget
    ? currency === 'USD'
      ? `$${budget.budgetAmount.toLocaleString()}`
      : `£${budget.budgetAmount.toLocaleString()}`
    : currency === 'USD'
      ? '$0'
      : '£0';

  const usedDisplay = currency === 'USD'
    ? `$${Math.round(totalMonthlyUsd).toLocaleString()}`
    : `£${Math.round(toGbp(totalMonthlyUsd)).toLocaleString()}`;

  const budgetDisplay = budget
    ? currency === 'USD'
      ? `$${budget.budgetAmount.toLocaleString()}`
      : `£${budget.budgetAmount.toLocaleString()}`
    : currency === 'USD'
      ? '$0'
      : '£0';

  return (
    <div>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <span className={styles.titleAccent}>{'// DCA PLAN'}</span>
        <h1 className={styles.title}>
          Dollar Cost <span className={styles.titleGradient}>Averaging</span>
        </h1>
      </div>

      {/* ─── Budget Bar ─── */}
      <div className={styles.budgetBar}>
        <div>
          <div className={styles.budgetLabel}>Monthly Budget</div>
          {editingBudget ? (
            <input
              className={styles.budgetInput}
              type="number"
              value={budgetDraft}
              onChange={(e) => setBudgetDraft(e.target.value)}
              onBlur={confirmBudget}
              onKeyDown={(e) => e.key === 'Enter' && confirmBudget()}
              autoFocus
            />
          ) : (
            <div className={styles.budgetValue} onClick={startEditBudget}>
              {displayBudget}
            </div>
          )}
        </div>

        <div className={styles.budgetUsed}>
          <div className={styles.budgetUsedText}>
            Used <span className={styles.budgetUsedHighlight}>{usedDisplay}</span> / {budgetDisplay}
          </div>
          <div className={styles.budgetProgress}>
            <div
              className={styles.budgetProgressFill}
              style={{
                width: `${budgetUsedPct}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        </div>

        <div className={styles.currencyToggle}>
          <button
            type="button"
            className={`${styles.currencyBtn} ${currency === 'GBP' ? styles.currencyBtnActive : ''}`}
            onClick={() => toggleCurrency('GBP')}
          >
            £ GBP
          </button>
          <button
            type="button"
            className={`${styles.currencyBtn} ${currency === 'USD' ? styles.currencyBtnActive : ''}`}
            onClick={() => toggleCurrency('USD')}
          >
            $ USD
          </button>
        </div>
      </div>

      {/* ─── Plan Section ─── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionLabel}>
              {view === 'weekly' ? '// WEEKLY PLAN' : '// MONTHLY OVERVIEW'}
            </div>
            <div className={styles.sectionSubtitle}>
              {view === 'weekly'
                ? 'Distribute your prop firm purchases across the week'
                : 'Monthly cost breakdown by account'}
            </div>
          </div>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'weekly' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('weekly')}
            >
              Weekly
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'monthly' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* ─── Weekly View ─── */}
        {view === 'weekly' && (
          <div className={styles.dayGrid}>
            {DAYS.map((day) => {
              const dayEntries = entriesByDay.get(day.key) || [];
              const dayTotalUsd = dayEntries.reduce((s, e) => s + e.costUsd, 0);
              const isEmpty = dayEntries.length === 0;

              return (
                <div
                  key={day.key}
                  className={`${styles.dayCard} ${isEmpty ? styles.dayCardEmpty : ''}`}
                >
                  <div className={styles.dayName}>{day.label}</div>

                  <div className={styles.dayEntries}>
                    {isEmpty ? (
                      <div className={styles.dayEmpty}>No accounts</div>
                    ) : (
                      dayEntries.map((e) => (
                        <div key={e.id} className={styles.accountPill}>
                          <div className={styles.accountPillTop}>
                            <span className={styles.accountPillFirm}>
                              {e.firm} {e.accountSize}
                            </span>
                            <button
                              type="button"
                              className={styles.accountPillRemove}
                              onClick={() => handleRemove(e.id)}
                            >
                              ×
                            </button>
                          </div>
                          <div className={styles.accountPillCost}>
                            {formatBoth(e.costUsd)}
                          </div>
                          <div className={styles.accountPillFreq}>
                            {FREQ_LABELS[e.frequency]} →{' '}
                            {formatCost(monthlyEquiv(e.costUsd, e.frequency), currency)}/mo
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={styles.dayFooter}>
                    {dayTotalUsd > 0 && (
                      <div className={styles.dayTotal}>
                        Daily:{' '}
                        <span className={styles.dayTotalValue}>
                          {formatBoth(dayTotalUsd)}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.addAccountBtn}
                      onClick={() => openAddModal(day.key)}
                    >
                      + Add Account
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Monthly View ─── */}
        {view === 'monthly' && (
          <div className={styles.monthlyView}>
            {/* Summary cards */}
            <div className={styles.monthlySummaryRow}>
              <div className={styles.monthlySummaryCard}>
                <div className={styles.monthlySummaryLabel}>Weekly Spend</div>
                <div className={styles.monthlySummaryValue}>
                  {formatCost(totalWeeklyUsd, currency)}
                </div>
              </div>
              <div className={styles.monthlySummaryCard}>
                <div className={styles.monthlySummaryLabel}>Monthly Spend</div>
                <div className={styles.monthlySummaryValue}>
                  {formatCost(totalMonthlyUsd, currency)}
                </div>
              </div>
              <div className={styles.monthlySummaryCard}>
                <div className={styles.monthlySummaryLabel}>Total Accounts</div>
                <div className={styles.monthlySummaryValue}>{entries.length}</div>
              </div>
              <div className={styles.monthlySummaryCard}>
                <div className={styles.monthlySummaryLabel}>Budget Remaining</div>
                <div
                  className={styles.monthlySummaryValue}
                  style={{ color: budgetUsd - totalMonthlyUsd >= 0 ? 'var(--success)' : 'var(--danger)' }}
                >
                  {formatCost(Math.max(0, budgetUsd - totalMonthlyUsd), currency)}
                </div>
              </div>
            </div>

            {/* Account breakdown table */}
            {monthlyRows.length === 0 ? (
              <div className={styles.monthlyEmpty}>No accounts in plan yet</div>
            ) : (
              <div className={styles.monthlyTableWrap}>
                <table className={styles.monthlyTable}>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Day</th>
                      <th>Frequency</th>
                      <th>Per Purchase</th>
                      <th>Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {e.firm} {e.accountSize}
                        </td>
                        <td>{DAYS.find((d) => d.key === e.dayOfWeek)?.label}</td>
                        <td>{FREQ_LABELS[e.frequency]}</td>
                        <td style={{ color: 'var(--accent)' }}>{formatBoth(e.costUsd)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatCost(monthlyEquiv(e.costUsd, e.frequency), currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                        Total Monthly
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.875rem' }}>
                        {formatCost(totalMonthlyUsd, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Weekly breakdown mini bar */}
            <div className={styles.weeklyBreakdown}>
              <div className={styles.weeklyBreakdownTitle}>Weekly Breakdown</div>
              <div className={styles.weeklyBreakdownGrid}>
                {weeklyTotalsByDay.map((d) => (
                  <div key={d.key} className={styles.weeklyBreakdownDay}>
                    <div className={styles.weeklyBreakdownDayName}>{d.label}</div>
                    <div className={styles.weeklyBreakdownDayCount}>
                      {d.entries.length} acct{d.entries.length !== 1 ? 's' : ''}
                    </div>
                    <div className={styles.weeklyBreakdownDayCost}>
                      {d.weeklyUsd > 0 ? formatCost(d.weeklyUsd, currency) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add Account Modal ─── */}
      {addDay && (
        <div className={styles.modalOverlay} onClick={() => setAddDay(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Add to {DAYS.find((d) => d.key === addDay)?.label}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Prop Firm</label>
                <input
                  className={styles.formInput}
                  list="firm-options"
                  value={formFirm}
                  onChange={(e) => setFormFirm(e.target.value)}
                  placeholder="e.g. ACG"
                />
                <datalist id="firm-options">
                  {firmOptions.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Account Size</label>
                <input
                  className={styles.formInput}
                  list="size-options"
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                  placeholder="e.g. $10k"
                />
                <datalist id="size-options">
                  {sizeOptions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cost (USD)</label>
              <input
                type="number"
                step="0.01"
                className={styles.formInput}
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                placeholder="e.g. 30"
              />
              {formCost && Number(formCost) > 0 && (
                <div className={styles.convertedAmount}>
                  ≈ £{toGbp(Number(formCost)).toFixed(2)}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Frequency</label>
              <div className={styles.freqToggle}>
                {(['weekly', 'biweekly', 'monthly'] as DCAFrequency[]).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      className={`${styles.freqBtn} ${formFreq === f ? styles.freqBtnActive : ''}`}
                      onClick={() => setFormFreq(f)}
                    >
                      {f === 'biweekly' ? '2 Weeks' : f}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setAddDay(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleAdd}
                disabled={saving || !formFirm || !formSize || !formCost || Number(formCost) <= 0}
              >
                {saving
                  ? 'Adding...'
                  : `Add to ${DAYS.find((d) => d.key === addDay)?.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
