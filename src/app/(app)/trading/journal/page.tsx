'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  getAccounts,
  getTrades,
  createTrade,
  deleteTrade,
} from '@/lib/trading';
import type { TradingAccount, Trade } from '@/lib/types';
import styles from './journal.module.css';

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseR(raw: string): number | null {
  const s = raw.trim().replace(/[rR]$/, '').replace(/^\+/, '');
  if (s === '' || isNaN(Number(s))) return null;
  return Number(s);
}

interface ParsedRow {
  date: string;
  month: string;
  time: string | null;
  asset: string;
  assetClass: 'Forex' | 'Futures';
  session: 'LDN' | 'NY';
  result: number;
  model: string;
}

/**
 * Parse a single tab-separated row from Google Sheets.
 * Expected column order:
 *   0: Asset Class (FX / FUTURES)
 *   1: Asset (EUR/USD, NQ, etc.)
 *   2: Month (Jan, Feb, Mar...)
 *   3: Day (7, 11, 14...)
 *   4: Model (5m Hybrid, LRV...)
 *   5: Time (14:30, 11:14...)
 *   6: Session (LDN, NY)
 *   7: Result (R value: -0.37, 1.2, 3, -1)
 */
function parseSheetRow(cols: string[]): ParsedRow | null {
  if (cols.length < 8) return null;

  const rawClass = cols[0].trim().toUpperCase();
  // Skip header rows or non-data rows
  if (rawClass !== 'FX' && rawClass !== 'FUTURES') return null;

  const assetClass: 'Forex' | 'Futures' = rawClass === 'FX' ? 'Forex' : 'Futures';
  const asset = cols[1].trim().toUpperCase();
  const monthStr = cols[2].trim();
  const dayStr = cols[3].trim();
  const model = cols[4].trim();
  const time = cols[5].trim() || null;
  const sessionRaw = cols[6].trim().toUpperCase();
  const result = parseR(cols[7]);

  if (result === null) return null;

  // Build date from month name + day
  const mi = MONTH_MAP[monthStr.toLowerCase().slice(0, 3)];
  if (mi === undefined) return null;
  const day = parseInt(dayStr, 10);
  if (isNaN(day)) return null;

  const year = new Date().getFullYear();
  const date = `${year}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const month = MONTHS[mi];

  const session: 'LDN' | 'NY' =
    sessionRaw === 'LDN' || sessionRaw === 'NY' ? sessionRaw : 'NY';

  return { date, month, time, asset, assetClass, session, result, model };
}

interface TradeForm {
  accountIds: string[];
  date: string;
  asset: string;
  assetClass: 'Forex' | 'Futures';
  model: string;
  time: string;
  session: 'LDN' | 'NY';
  result: string;
  bias: '' | 'Bullish' | 'Bearish';
  tradingviewUrl: string;
  biasUrl: string;
  notes: string;
}

const emptyForm: TradeForm = {
  accountIds: [],
  date: new Date().toISOString().split('T')[0],
  asset: '',
  assetClass: 'Futures',
  model: '',
  time: '',
  session: 'LDN',
  result: '',
  bias: '',
  tradingviewUrl: '',
  biasUrl: '',
  notes: '',
};

type ModalTab = 'paste' | 'single';

export default function TradingJournal() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [filterSession, setFilterSession] = useState<string>('');
  const [filterAsset, setFilterAsset] = useState<string>('');
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterAccount, setFilterAccount] = useState<string>('');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('paste');
  const [form, setForm] = useState<TradeForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Paste state
  const [pasteText, setPasteText] = useState('');
  const [pasteAccountIds, setPasteAccountIds] = useState<string[]>([]);
  const [pasteError, setPasteError] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      const [accts, allTrades] = await Promise.all([
        getAccounts(user.id),
        getTrades(user.id),
      ]);

      if (!mounted) return;
      setAccounts(accts);
      setTrades(allTrades);
      setLoading(false);

      // Auto-open modal if ?mode=log
      if (searchParams.get('mode') === 'log') {
        setShowAddModal(true);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  // Unique values for filter dropdowns
  const uniqueAssets = useMemo(
    () => Array.from(new Set(trades.map((t) => t.asset))).sort(),
    [trades]
  );
  const uniqueModels = useMemo(
    () => Array.from(new Set(trades.map((t) => t.model))).sort(),
    [trades]
  );
  const uniqueMonths = useMemo(
    () => MONTHS.filter((m) => trades.some((t) => t.month === m)),
    [trades]
  );

  // Filtered trades
  const filteredTrades = useMemo(() => {
    let result = trades;
    if (filterSession) result = result.filter((t) => t.session === filterSession);
    if (filterAsset) result = result.filter((t) => t.asset === filterAsset);
    if (filterModel) result = result.filter((t) => t.model === filterModel);
    if (filterMonth) result = result.filter((t) => t.month === filterMonth);
    if (filterAccount) result = result.filter((t) => t.accountIds.includes(filterAccount));
    return result;
  }, [trades, filterSession, filterAsset, filterModel, filterMonth, filterAccount]);

  // Compute running R counter for filtered view
  const tradesWithCounter = useMemo(() => {
    let running = 0;
    return filteredTrades.map((t) => {
      running += t.result;
      return { ...t, runningR: Math.round(running * 100) / 100 };
    });
  }, [filteredTrades]);

  // Parse pasted rows — fixed column order from Google Sheets
  const parsedPasteRows = useMemo((): ParsedRow[] => {
    if (!pasteText.trim()) return [];
    const lines = pasteText.trim().split('\n').filter((l) => l.trim());
    return lines
      .map((line) => parseSheetRow(line.split('\t')))
      .filter((r): r is ParsedRow => r !== null);
  }, [pasteText]);

  const setField = <K extends keyof TradeForm>(field: K, value: TradeForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAccount = (id: string) => {
    setForm((prev) => {
      const has = prev.accountIds.includes(id);
      return {
        ...prev,
        accountIds: has
          ? prev.accountIds.filter((a) => a !== id)
          : [...prev.accountIds, id],
      };
    });
  };

  const togglePasteAccount = (id: string) => {
    setPasteAccountIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const openAdd = (tab?: ModalTab) => {
    setForm(emptyForm);
    setPasteText('');
    setPasteAccountIds([]);
    setPasteError('');
    setModalTab(tab || 'paste');
    setShowAddModal(true);
  };

  // Single trade save
  const handleSave = async () => {
    if (!userId || saving || form.accountIds.length === 0) return;
    setSaving(true);

    try {
      const dateObj = new Date(form.date + 'T00:00:00');
      const month = MONTHS[dateObj.getMonth()];
      const newResult = Number(form.result) || 0;
      const currentR = trades.reduce((sum, t) => sum + t.result, 0);
      const rCounter = Math.round((currentR + newResult) * 100) / 100;

      const created = await createTrade({
        userId,
        accountIds: form.accountIds,
        date: form.date,
        month,
        asset: form.asset,
        assetClass: form.assetClass,
        model: form.model,
        time: form.time || null,
        session: form.session,
        result: newResult,
        bias: form.bias || null,
        rCounter,
        tradingviewUrl: form.tradingviewUrl || null,
        biasUrl: form.biasUrl || null,
        notes: form.notes || null,
      });

      setTrades((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  // Paste import
  const handlePasteImport = async () => {
    if (!userId || saving || pasteAccountIds.length === 0) return;
    if (parsedPasteRows.length === 0) {
      setPasteError('No valid rows found — expected columns: Asset Class | Asset | Month | Day | Model | Time | Session | R');
      return;
    }

    setSaving(true);
    setPasteError('');

    try {
      // Compute running R from existing trades
      let runningR = trades.reduce((sum, t) => sum + t.result, 0);
      const created: Trade[] = [];

      for (const row of parsedPasteRows) {
        runningR += row.result;

        const trade = await createTrade({
          userId,
          accountIds: pasteAccountIds,
          date: row.date,
          month: row.month,
          asset: row.asset,
          assetClass: row.assetClass,
          model: row.model,
          time: row.time,
          session: row.session,
          result: row.result,
          bias: null,
          rCounter: Math.round(runningR * 100) / 100,
          tradingviewUrl: null,
          biasUrl: null,
          notes: null,
        });
        created.push(trade);
      }

      setTrades((prev) =>
        [...prev, ...created].sort((a, b) => a.date.localeCompare(b.date))
      );
      setShowAddModal(false);
    } catch (err) {
      setPasteError('Failed to import some trades. Check your data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTrade(deleteId);
    setTrades((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
  };

  const rClass = (r: number) =>
    r > 0 ? styles.rPositive : r < 0 ? styles.rNegative : styles.rZero;

  const accountNames = (ids: string[]) => {
    if (ids.length === 0) return '—';
    return ids
      .map((id) => {
        const a = accounts.find((acc) => acc.id === id);
        return a ? `${a.firm} ${a.size}` : '?';
      })
      .join(', ');
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading trades...</div>;
  }

  return (
    <div>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.titleAccent}>{'// TRADE LOG'}</span>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Journal</span>
          </h1>
        </div>
        <button type="button" className={styles.addBtn} onClick={() => openAdd()}>
          + Log Trade
        </button>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className={styles.filterBar}>
        <select className={styles.filterSelect} value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
          <option value="">All Sessions</option>
          <option value="LDN">LDN</option>
          <option value="NY">NY</option>
        </select>
        <select className={styles.filterSelect} value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)}>
          <option value="">All Assets</option>
          {uniqueAssets.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
          <option value="">All Models</option>
          {uniqueModels.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">All Months</option>
          {uniqueMonths.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
          <option value="">All Accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.firm} {a.size}</option>)}
        </select>
      </div>

      {/* ─── Table ─── */}
      {tradesWithCounter.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No trades found</div>
          <div>{trades.length === 0 ? 'Log your first trade to get started.' : 'No trades match your filters.'}</div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Accounts</th>
                <th>Asset</th>
                <th>Class</th>
                <th>Model</th>
                <th>Time</th>
                <th>Session</th>
                <th>Result</th>
                <th>Bias</th>
                <th>R Counter</th>
                <th>TV</th>
                <th>Bias Chart</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tradesWithCounter.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{accountNames(t.accountIds)}</td>
                  <td>{t.asset}</td>
                  <td>
                    <span className={`${styles.assetClassBadge} ${t.assetClass === 'Forex' ? styles.assetClassForex : styles.assetClassFutures}`}>
                      {t.assetClass}
                    </span>
                  </td>
                  <td>{t.model}</td>
                  <td>{t.time || '—'}</td>
                  <td>
                    <span className={`${styles.sessionBadge} ${t.session === 'LDN' ? styles.sessionLDN : styles.sessionNY}`}>
                      {t.session}
                    </span>
                  </td>
                  <td className={rClass(t.result)}>{t.result >= 0 ? '+' : ''}{t.result}R</td>
                  <td className={t.bias === 'Bullish' ? styles.biasBullish : t.bias === 'Bearish' ? styles.biasBearish : ''}>{t.bias || '—'}</td>
                  <td className={rClass(t.runningR)}>{t.runningR >= 0 ? '+' : ''}{t.runningR}R</td>
                  <td>{t.tradingviewUrl ? <a href={t.tradingviewUrl} target="_blank" rel="noopener noreferrer" className={styles.chartLink} onClick={(e) => e.stopPropagation()}>View</a> : '—'}</td>
                  <td>{t.biasUrl ? <a href={t.biasUrl} target="_blank" rel="noopener noreferrer" className={styles.chartLink} onClick={(e) => e.stopPropagation()}>View</a> : '—'}</td>
                  <td className={styles.notesCell} title={t.notes || ''}>{t.notes || '—'}</td>
                  <td><button type="button" className={styles.deleteBtn} onClick={() => setDeleteId(t.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Add Trade Modal ─── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Log Trade</div>

            {/* Tabs */}
            <div className={styles.modalTabs}>
              <button
                type="button"
                className={`${styles.modalTab} ${modalTab === 'paste' ? styles.modalTabActive : ''}`}
                onClick={() => setModalTab('paste')}
              >
                Paste from Sheets
              </button>
              <button
                type="button"
                className={`${styles.modalTab} ${modalTab === 'single' ? styles.modalTabActive : ''}`}
                onClick={() => setModalTab('single')}
              >
                Single Trade
              </button>
            </div>

            {/* ═══ Paste from Sheets Tab ═══ */}
            {modalTab === 'paste' && (
              <>
                {/* Account selection */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Accounts</label>
                  <div className={styles.checkboxGroup}>
                    {accounts.map((a) => (
                      <label
                        key={a.id}
                        className={`${styles.checkboxLabel} ${pasteAccountIds.includes(a.id) ? styles.checkboxLabelChecked : ''}`}
                      >
                        <input type="checkbox" checked={pasteAccountIds.includes(a.id)} onChange={() => togglePasteAccount(a.id)} />
                        {a.firm} {a.size}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.pasteSection}>
                  <div className={styles.pasteInstructions}>
                    Select rows in Google Sheets, Cmd+C, then paste below.
                  </div>
                  <textarea
                    className={styles.pasteTextarea}
                    value={pasteText}
                    onChange={(e) => { setPasteText(e.target.value); setPasteError(''); }}
                    placeholder={`FX\tEUR/USD\tJan\t7\t5m Hybrid\t14:30\tNY\t-0.37\nFX\tAUD/USD\tJan\t14\t5m Hybrid\t12:21\tLDN\t-1\nFUTURES\tNQ\tJan\t15\tLRV\t11:30\tNY\t3`}
                  />

                  {parsedPasteRows.length > 0 && (
                    <>
                      <div className={styles.pastePreview}>
                        <span className={styles.pastePreviewCount}>{parsedPasteRows.length}</span> trade{parsedPasteRows.length !== 1 ? 's' : ''} detected
                      </div>
                      {/* Preview table — first 5 rows */}
                      <div className={styles.previewTableWrap}>
                        <table className={styles.previewTable}>
                          <thead>
                            <tr>
                              <th>Asset</th>
                              <th>Date</th>
                              <th>Model</th>
                              <th>Session</th>
                              <th>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedPasteRows.slice(0, 5).map((r, i) => (
                              <tr key={i}>
                                <td>{r.asset}</td>
                                <td>{r.date}</td>
                                <td>{r.model}</td>
                                <td>{r.session}</td>
                                <td className={r.result >= 0 ? styles.rPositive : styles.rNegative}>
                                  {r.result >= 0 ? '+' : ''}{r.result}R
                                </td>
                              </tr>
                            ))}
                            {parsedPasteRows.length > 5 && (
                              <tr>
                                <td colSpan={5} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                  +{parsedPasteRows.length - 5} more
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  {pasteText.trim() && parsedPasteRows.length === 0 && (
                    <div className={styles.pasteError}>
                      No valid rows found. Expected 8 tab-separated columns starting with FX or FUTURES.
                    </div>
                  )}
                  {pasteError && <div className={styles.pasteError}>{pasteError}</div>}
                </div>

                <div className={styles.rGuide}>
                  <div className={styles.rGuideTitle}>Expected Columns</div>
                  <div className={styles.rGuideCols}>
                    {'Asset Class (FX/FUTURES) \u00b7 Asset \u00b7 Month \u00b7 Day \u00b7 Model \u00b7 Time \u00b7 Session \u00b7 R Value'}
                  </div>
                  <div className={styles.rGuideText} style={{ marginTop: '0.375rem' }}>
                    <span className={styles.rGuideGreen}>+3 or 1.5 = WIN</span>
                    {'    '}
                    <span className={styles.rGuideRed}>-1 or -0.37 = LOSS</span>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handlePasteImport}
                    disabled={saving || pasteAccountIds.length === 0 || parsedPasteRows.length === 0}
                  >
                    {saving ? 'Importing...' : `Import ${parsedPasteRows.length} Trade${parsedPasteRows.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}

            {/* ═══ Single Trade Tab ═══ */}
            {modalTab === 'single' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Accounts</label>
                  <div className={styles.checkboxGroup}>
                    {accounts.map((a) => (
                      <label
                        key={a.id}
                        className={`${styles.checkboxLabel} ${form.accountIds.includes(a.id) ? styles.checkboxLabelChecked : ''}`}
                      >
                        <input type="checkbox" checked={form.accountIds.includes(a.id)} onChange={() => toggleAccount(a.id)} />
                        {a.firm} {a.size}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date</label>
                    <input type="date" className={styles.formInput} value={form.date} onChange={(e) => setField('date', e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Asset Class</label>
                    <select className={styles.formSelect} value={form.assetClass} onChange={(e) => setField('assetClass', e.target.value as 'Forex' | 'Futures')}>
                      <option value="Futures">Futures</option>
                      <option value="Forex">Forex</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Asset</label>
                    <input className={styles.formInput} value={form.asset} onChange={(e) => setField('asset', e.target.value)} placeholder="e.g. NQ" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Model</label>
                    <input className={styles.formInput} value={form.model} onChange={(e) => setField('model', e.target.value)} placeholder="e.g. LRV" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Session</label>
                    <select className={styles.formSelect} value={form.session} onChange={(e) => setField('session', e.target.value as 'LDN' | 'NY')}>
                      <option value="LDN">LDN</option>
                      <option value="NY">NY</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Result (R)</label>
                    <input type="number" step="0.1" className={styles.formInput} value={form.result} onChange={(e) => setField('result', e.target.value)} placeholder="e.g. 1.5" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bias</label>
                    <select className={styles.formSelect} value={form.bias} onChange={(e) => setField('bias', e.target.value as '' | 'Bullish' | 'Bearish')}>
                      <option value="">—</option>
                      <option value="Bullish">Bullish</option>
                      <option value="Bearish">Bearish</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Time</label>
                    <input className={styles.formInput} value={form.time} onChange={(e) => setField('time', e.target.value)} placeholder="e.g. 13:10" />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>TradingView URL</label>
                    <input className={styles.formInput} value={form.tradingviewUrl} onChange={(e) => setField('tradingviewUrl', e.target.value)} placeholder="Chart screenshot link" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bias URL</label>
                    <input className={styles.formInput} value={form.biasUrl} onChange={(e) => setField('biasUrl', e.target.value)} placeholder="Bias chart link" />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notes</label>
                  <textarea className={styles.formTextarea} value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Trade notes..." />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving || form.accountIds.length === 0 || !form.asset || !form.result}
                  >
                    {saving ? 'Saving...' : 'Log Trade'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Delete Trade</div>
            <p className={styles.confirmText}>Are you sure you want to delete this trade? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete Trade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
