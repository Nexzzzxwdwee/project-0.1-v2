'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTimeLog, saveTimeLogSlot, saveTimeLogMeta, createDefaultTimeLog } from '@/lib/presets';
import type { TimeLog, TimeLogInterval, TimeLogSlot } from '@/lib/types';
import styles from './journal.module.css';

interface TimeTrackerProps {
  date: string; // YYYY-MM-DD
  onSaveStatusChange?: (status: 'saved' | 'saving' | 'error') => void;
}

function slotKey(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function buildSlotKeys(interval: TimeLogInterval): string[] {
  const keys: string[] = [];
  const step = interval; // 60 or 15
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += step) {
      keys.push(slotKey(h, m));
    }
  }
  return keys;
}

function isToday(dateStr: string): boolean {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return today === dateStr;
}

function currentSlotKey(interval: TimeLogInterval): string {
  const now = new Date();
  const h = now.getHours();
  const m = Math.floor(now.getMinutes() / interval) * interval;
  return slotKey(h, m);
}

function baselineTier(n: number): 'none' | 'low' | 'mid' | 'high' {
  if (n <= 0) return 'none';
  if (n <= 3) return 'low';
  if (n <= 6) return 'mid';
  return 'high';
}

export default function TimeTracker({ date, onSaveStatusChange }: TimeTrackerProps) {
  const [log, setLog] = useState<TimeLog>(() => createDefaultTimeLog(date));
  const [loaded, setLoaded] = useState(false);
  const [nowKey, setNowKey] = useState(() => currentSlotKey(60));
  const [popoverKey, setPopoverKey] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; right: number } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Only the slots/fields this view changed are queued, so saving merges with
  // the latest server state instead of overwriting the whole day.
  const pendingSlotsRef = useRef<Map<string, TimeLogSlot | null>>(new Map());
  const pendingMetaRef = useRef<Partial<Pick<TimeLog, 'interval' | 'wins' | 'learnt' | 'tomorrow' | 'notes'>>>({});
  const todayHere = isToday(date);

  const closePopover = useCallback(() => {
    setPopoverKey(null);
    setPopoverAnchor(null);
  }, []);

  // Close popover on outside click, scroll, or resize
  useEffect(() => {
    if (!popoverKey) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest(`.${styles.ttBaselinePopover}`)) return;
      if (t.closest(`.${styles.ttBaselineCircle}`)) return;
      closePopover();
    };
    const onScrollOrResize = () => closePopover();
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [popoverKey, closePopover]);

  // Load log when date changes
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      try {
        const loaded = await getTimeLog(date);
        if (!cancelled) {
          setLog(loaded);
          setLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load time log:', error);
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  // Keep the "current slot" highlight fresh
  useEffect(() => {
    if (!todayHere) return;
    setNowKey(currentSlotKey(log.interval));
    const id = setInterval(() => {
      setNowKey(currentSlotKey(log.interval));
    }, 30_000);
    return () => clearInterval(id);
  }, [log.interval, todayHere]);

  const flushPending = useCallback(() => {
    const slots = pendingSlotsRef.current;
    const meta = pendingMetaRef.current;
    pendingSlotsRef.current = new Map();
    pendingMetaRef.current = {};
    const writes: Promise<void>[] = [];
    slots.forEach((slotValue, key) => writes.push(saveTimeLogSlot(date, key, slotValue)));
    if (Object.keys(meta).length > 0) writes.push(saveTimeLogMeta(date, meta));
    if (writes.length === 0) {
      onSaveStatusChange?.('saved');
      return;
    }
    Promise.all(writes)
      .then(() => onSaveStatusChange?.('saved'))
      .catch((error) => {
        // Surface the failure instead of falsely showing "saved". The failed
        // writes were already cleared from the pending refs, so editing the
        // slot again re-queues it.
        console.error('Failed to save time log:', error);
        onSaveStatusChange?.('error');
      });
  }, [date, onSaveStatusChange]);

  const scheduleFlush = useCallback(() => {
    onSaveStatusChange?.('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      flushPending();
    }, 600);
  }, [flushPending, onSaveStatusChange]);

  // Flush any pending edit on unmount or when switching to a different entry's
  // date (flushPending closes over `date`, so the cleanup runs on date change
  // too) — otherwise typed text for the old date would silently drop.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      flushPending();
    };
  }, [flushPending]);

  // Persist one slot (null = clear) without touching the rest of the day, so
  // edits here can't clobber slots written from /today (and vice versa).
  const commitSlot = (key: string, nextSlot: TimeLogSlot | null) => {
    setLog((prev) => {
      const slots = { ...prev.slots };
      if (nextSlot === null) delete slots[key];
      else slots[key] = nextSlot;
      return { ...prev, slots, updatedAt: Date.now() };
    });
    pendingSlotsRef.current.set(key, nextSlot);
    scheduleFlush();
  };

  const commitMeta = (
    partial: Partial<Pick<TimeLog, 'interval' | 'wins' | 'learnt' | 'tomorrow' | 'notes'>>,
  ) => {
    setLog((prev) => ({ ...prev, ...partial, updatedAt: Date.now() }));
    Object.assign(pendingMetaRef.current, partial);
    scheduleFlush();
  };

  const setInterval15 = (interval: TimeLogInterval) => {
    if (interval === log.interval) return;
    commitMeta({ interval });
  };

  const setSlotActivity = (key: string, activity: string) => {
    const existing: TimeLogSlot = log.slots[key] ?? { activity: '', baseline: 0 };
    const nextSlot: TimeLogSlot = { ...existing, activity };
    commitSlot(key, !nextSlot.activity && !nextSlot.baseline ? null : nextSlot);
  };

  const setSlotBaseline = (key: string, baseline: number) => {
    const existing: TimeLogSlot = log.slots[key] ?? { activity: '', baseline: 0 };
    const nextBaseline = existing.baseline === baseline ? 0 : baseline;
    const nextSlot: TimeLogSlot = { ...existing, baseline: nextBaseline };
    commitSlot(key, !nextSlot.activity && !nextSlot.baseline ? null : nextSlot);
  };

  const setSummaryField = (field: 'wins' | 'learnt' | 'tomorrow' | 'notes', value: string) => {
    commitMeta({ [field]: value } as Partial<Pick<TimeLog, 'wins' | 'learnt' | 'tomorrow' | 'notes'>>);
  };

  const slotKeys = buildSlotKeys(log.interval);

  return (
    <div className={styles.timeTracker}>
      {/* Toolbar */}
      <div className={styles.ttToolbar}>
        <div className={styles.ttIntervalToggle}>
          <button
            type="button"
            className={`${styles.ttIntervalBtn} ${log.interval === 60 ? styles.ttIntervalBtnActive : ''}`}
            onClick={() => setInterval15(60)}
          >
            1 HR
          </button>
          <button
            type="button"
            className={`${styles.ttIntervalBtn} ${log.interval === 15 ? styles.ttIntervalBtnActive : ''}`}
            onClick={() => setInterval15(15)}
          >
            15 MIN
          </button>
        </div>
        <div className={styles.ttToolbarHint}>
          {todayHere
            ? 'Current slot highlighted in green.'
            : 'Logging past day — current-slot highlight disabled.'}
        </div>
      </div>

      {/* Hourly grid */}
      <div className={styles.ttGrid}>
        <div className={styles.ttGridHeader}>
          <span>HOUR</span>
          <span>ACTIVITY</span>
          <span>EMOTIONAL BASELINE</span>
        </div>
        <div className={styles.ttGridBody}>
          {loaded &&
            slotKeys.map((key) => {
              const slot: TimeLogSlot = log.slots[key] ?? { activity: '', baseline: 0 };
              const isNow = todayHere && key === nowKey;
              return (
                <div
                  key={key}
                  className={`${styles.ttRow} ${isNow ? styles.ttRowCurrent : ''}`}
                >
                  <div className={styles.ttRowHour}>{key}</div>
                  <input
                    type="text"
                    className={styles.ttRowActivity}
                    placeholder="What are you doing?"
                    value={slot.activity}
                    onChange={(e) => setSlotActivity(key, e.target.value)}
                  />
                  <div className={styles.ttRowBaseline}>
                    <button
                      type="button"
                      aria-label={slot.baseline ? `Baseline ${slot.baseline}` : 'Set baseline'}
                      aria-expanded={popoverKey === key}
                      className={`${styles.ttBaselineCircle} ${styles[`ttBaselineTier_${baselineTier(slot.baseline)}`]}`}
                      onClick={(e) => {
                        if (popoverKey === key) {
                          closePopover();
                          return;
                        }
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPopoverKey(key);
                        setPopoverAnchor({
                          top: rect.bottom + 6,
                          right: window.innerWidth - rect.right,
                        });
                      }}
                    >
                      {slot.baseline || '—'}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Summary + Notes */}
      <div className={styles.ttBottom}>
        <div className={styles.ttSummary}>
          <label className={styles.ttSummaryField}>
            <span className={styles.ttSummaryLabel}>{'// WINS OF THE DAY'}</span>
            <textarea
              className={styles.ttSummaryInput}
              value={log.wins}
              onChange={(e) => setSummaryField('wins', e.target.value)}
              placeholder="What won today?"
            />
          </label>
          <label className={styles.ttSummaryField}>
            <span className={styles.ttSummaryLabel}>{'// WHAT I LEARNT'}</span>
            <textarea
              className={styles.ttSummaryInput}
              value={log.learnt}
              onChange={(e) => setSummaryField('learnt', e.target.value)}
              placeholder="Lessons from today."
            />
          </label>
          <label className={styles.ttSummaryField}>
            <span className={styles.ttSummaryLabel}>{"// TOMORROW'S FOCUS"}</span>
            <textarea
              className={styles.ttSummaryInput}
              value={log.tomorrow}
              onChange={(e) => setSummaryField('tomorrow', e.target.value)}
              placeholder="What matters tomorrow?"
            />
          </label>
        </div>
        <label className={styles.ttNotes}>
          <span className={styles.ttSummaryLabel}>{'// NOTES'}</span>
          <textarea
            className={styles.ttNotesInput}
            value={log.notes}
            onChange={(e) => setSummaryField('notes', e.target.value)}
            placeholder="Anything else worth keeping."
          />
        </label>
      </div>

      {popoverKey && popoverAnchor && (
        <div
          className={styles.ttBaselinePopover}
          style={{ top: popoverAnchor.top, right: popoverAnchor.right }}
          role="dialog"
          aria-label="Pick emotional baseline"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const tier = baselineTier(n);
            const current = log.slots[popoverKey] ?? { activity: '', baseline: 0 };
            const active = current.baseline === n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`Baseline ${n}`}
                aria-pressed={active}
                className={`${styles.ttBaselineOption} ${styles[`ttBaselineTier_${tier}`]} ${active ? styles.ttBaselineOptionActive : ''}`}
                onClick={() => {
                  setSlotBaseline(popoverKey, n);
                  closePopover();
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
