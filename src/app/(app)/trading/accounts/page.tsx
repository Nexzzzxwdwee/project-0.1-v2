'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  getAccounts,
  createAccount,
  updateAccount,
  getTrades,
  getEquityCurve,
  parseSize,
} from '@/lib/trading';
import type { TradingAccount, Trade, REquityCurvePoint } from '@/lib/types';
import styles from './accounts.module.css';

type ModalMode = 'add' | 'edit' | null;

interface AccountForm {
  firm: string;
  size: string;
  stage: string;
  model: string;
  asset: string;
  status: 'active' | 'passed' | 'blown' | 'limbo';
  maxAllocation: string;
}

const emptyForm: AccountForm = {
  firm: '',
  size: '',
  stage: 'Phase 1',
  model: '',
  asset: '',
  status: 'active',
  maxAllocation: '',
};

export default function TradingAccounts() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCurve, setExpandedCurve] = useState<REquityCurvePoint[]>([]);

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
      const [accts, trades] = await Promise.all([
        getAccounts(user.id),
        getTrades(user.id),
      ]);

      if (!mounted) return;
      setAccounts(accts);
      setAllTrades(trades);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Per-account R totals
  const accountRTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTrades) {
      for (const aid of t.accountIds) {
        map.set(aid, (map.get(aid) || 0) + t.result);
      }
    }
    return map;
  }, [allTrades]);

  // Total funding across all active accounts
  const totalFunding = useMemo(() => {
    return accounts
      .filter((a) => a.status === 'active')
      .reduce((sum, a) => sum + parseSize(a.size), 0);
  }, [accounts]);

  // Expand a row to show equity curve
  const handleRowClick = useCallback(
    async (accountId: string) => {
      if (expandedId === accountId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(accountId);
      if (userId) {
        const curve = await getEquityCurve(userId, accountId);
        setExpandedCurve(curve);
      }
    },
    [expandedId, userId]
  );

  // Open modal
  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModalMode('add');
  };

  const openEdit = (a: TradingAccount) => {
    setForm({
      firm: a.firm,
      size: a.size,
      stage: a.stage,
      model: a.model,
      asset: a.asset,
      status: a.status,
      maxAllocation: a.maxAllocation != null ? String(a.maxAllocation) : '',
    });
    setEditId(a.id);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!userId || saving) return;
    setSaving(true);

    try {
      if (modalMode === 'add') {
        const created = await createAccount({
          userId,
          firm: form.firm,
          size: form.size,
          stage: form.stage,
          model: form.model,
          asset: form.asset,
          status: form.status,
          maxAllocation: form.maxAllocation ? Number(form.maxAllocation) : null,
        });
        setAccounts((prev) => [created, ...prev]);
      } else if (modalMode === 'edit' && editId) {
        const updated = await updateAccount(editId, {
          firm: form.firm,
          size: form.size,
          stage: form.stage,
          model: form.model,
          asset: form.asset,
          status: form.status,
          maxAllocation: form.maxAllocation ? Number(form.maxAllocation) : null,
        });
        setAccounts((prev) =>
          prev.map((a) => (a.id === editId ? updated : a))
        );
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!userId) return;
    const updated = await updateAccount(id, { status: 'limbo' });
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const setField = (field: keyof AccountForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const badgeClass = (status: string) => {
    switch (status) {
      case 'active': return styles.badgeActive;
      case 'passed': return styles.badgePassed;
      case 'blown': return styles.badgeBlown;
      case 'limbo': return styles.badgeLimbo;
      default: return '';
    }
  };

  const rClass = (r: number) =>
    r > 0 ? styles.rPositive : r < 0 ? styles.rNegative : styles.rZero;

  if (loading) {
    return <div className={styles.loadingState}>Loading accounts...</div>;
  }

  return (
    <div>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.titleAccent}>{'// FUNDED ACCOUNTS'}</span>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Accounts</span>
          </h1>
        </div>
        <button type="button" className={styles.addBtn} onClick={openAdd}>
          + Add Account
        </button>
      </div>

      {/* ─── Funding Counter ─── */}
      {accounts.length > 0 && (
        <div className={styles.fundingBar}>
          <span className={styles.fundingLabel}>Total Active Funding</span>
          <span className={styles.fundingValue}>
            ${totalFunding.toLocaleString()}
          </span>
        </div>
      )}

      {/* ─── Table ─── */}
      {accounts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No accounts yet</div>
          <div>Add your first funded account to get started.</div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Firm</th>
                <th>Size</th>
                <th>Stage</th>
                <th>Model</th>
                <th>Asset</th>
                <th>Status</th>
                <th>Max Alloc</th>
                <th>Current R</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const r =
                  Math.round((accountRTotals.get(a.id) || 0) * 100) / 100;
                return (
                  <>
                    <tr key={a.id} onClick={() => handleRowClick(a.id)}>
                      <td>{a.firm}</td>
                      <td>{a.size}</td>
                      <td>{a.stage}</td>
                      <td>{a.model}</td>
                      <td>{a.asset}</td>
                      <td>
                        <span className={`${styles.badge} ${badgeClass(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        {a.maxAllocation != null
                          ? `$${Number(a.maxAllocation).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className={rClass(r)}>
                        {r >= 0 ? '+' : ''}
                        {r}R
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(a);
                            }}
                          >
                            Edit
                          </button>
                          {a.status === 'active' && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(a.id);
                              }}
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded equity curve */}
                    {expandedId === a.id && (
                      <tr key={`${a.id}-expanded`} className={styles.expandedRow}>
                        <td colSpan={9}>
                          <div className={styles.expandedContent}>
                            {expandedCurve.length === 0 ? (
                              <div className={styles.expandedEmpty}>
                                No trades for this account yet
                              </div>
                            ) : (
                              <div className={styles.expandedChart}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={expandedCurve}
                                    margin={{
                                      top: 8,
                                      right: 8,
                                      left: -16,
                                      bottom: 0,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id={`grad-${a.id}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="5%"
                                          stopColor={r >= 0 ? '#22c55e' : '#ef4444'}
                                          stopOpacity={0.2}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor={r >= 0 ? '#22c55e' : '#ef4444'}
                                          stopOpacity={0}
                                        />
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
                                    <ReferenceLine
                                      y={0}
                                      stroke="#262626"
                                      strokeDasharray="3 3"
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        background: '#1a1a1a',
                                        border: '1px solid #262626',
                                        borderRadius: '0.375rem',
                                        color: '#d4d4d4',
                                        fontFamily:
                                          'var(--font-mono), monospace',
                                        fontSize: '0.6875rem',
                                      }}
                                      formatter={(value) => [
                                        `${value}R`,
                                        'Cumulative R',
                                      ]}
                                      labelFormatter={(label) =>
                                        `Trade #${label}`
                                      }
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="cumulativeR"
                                      stroke={r >= 0 ? '#22c55e' : '#ef4444'}
                                      strokeWidth={2}
                                      fill={`url(#grad-${a.id})`}
                                      dot={false}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Add/Edit Modal ─── */}
      {modalMode && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              {modalMode === 'add' ? 'Add Account' : 'Edit Account'}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Firm</label>
                <input
                  className={styles.formInput}
                  value={form.firm}
                  onChange={(e) => setField('firm', e.target.value)}
                  placeholder="e.g. Topstep"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Size</label>
                <input
                  className={styles.formInput}
                  value={form.size}
                  onChange={(e) => setField('size', e.target.value)}
                  placeholder="e.g. 50k"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Stage</label>
                <select
                  className={styles.formSelect}
                  value={form.stage}
                  onChange={(e) => setField('stage', e.target.value)}
                >
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Live">Live</option>
                  <option value="Limbo (AF)">Limbo (AF)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select
                  className={styles.formSelect}
                  value={form.status}
                  onChange={(e) =>
                    setField('status', e.target.value)
                  }
                >
                  <option value="active">Active</option>
                  <option value="passed">Passed</option>
                  <option value="blown">Blown</option>
                  <option value="limbo">Limbo</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Model</label>
                <input
                  className={styles.formInput}
                  value={form.model}
                  onChange={(e) => setField('model', e.target.value)}
                  placeholder="e.g. H AUD+EUR"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Asset</label>
                <input
                  className={styles.formInput}
                  value={form.asset}
                  onChange={(e) => setField('asset', e.target.value)}
                  placeholder="e.g. NQ"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Max Allocation ($)</label>
              <input
                className={styles.formInput}
                type="number"
                value={form.maxAllocation}
                onChange={(e) => setField('maxAllocation', e.target.value)}
                placeholder="e.g. 50000"
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !form.firm || !form.size}
              >
                {saving ? 'Saving...' : modalMode === 'add' ? 'Add Account' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
