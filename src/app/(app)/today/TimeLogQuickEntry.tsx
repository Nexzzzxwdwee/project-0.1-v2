'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getTimeLog,
  saveTimeLog,
  createDefaultTimeLog,
  getTodayDateString,
} from '@/lib/presets';
import type { TimeLog, TimeLogInterval, TimeLogSlot } from '@/lib/types';
import styles from './today.module.css';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function slotKey(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

function computeNowKey(interval: TimeLogInterval): string {
  const d = new Date();
  return slotKey(d.getHours(), Math.floor(d.getMinutes() / interval) * interval);
}

function formatSlotRange(key: string, interval: TimeLogInterval): string {
  const [hh, mm] = key.split(':').map(Number);
  const startMin = hh * 60 + mm;
  const endMin = startMin + interval;
  const endH = Math.floor((endMin / 60) % 24);
  const endM = endMin % 60;
  return `${slotKey(hh, mm)} — ${slotKey(endH, endM)}`;
}

function baselineTier(n: number): 'none' | 'low' | 'mid' | 'high' {
  if (n <= 0) return 'none';
  if (n <= 3) return 'low';
  if (n <= 6) return 'mid';
  return 'high';
}

export default function TimeLogQuickEntry() {
  const today = getTodayDateString();
  const [log, setLog] = useState<TimeLog>(() => createDefaultTimeLog(today));
  const [loaded, setLoaded] = useState(false);
  const [nowKey, setNowKey] = useState<string>(() => computeNowKey(60));
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; right: number } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const activityFocusedRef = useRef(false);

  // Load today's log
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await getTimeLog(today);
        if (!cancelled) {
          setLog(fresh);
          setNowKey(computeNowKey(fresh.interval));
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
  }, [today]);

  // Tick nowKey every 30s; defer if user is typing so input doesn't jump
  useEffect(() => {
    const id = setInterval(() => {
      if (activityFocusedRef.current) return;
      setNowKey((prev) => {
        const next = computeNowKey(log.interval);
        return next === prev ? prev : next;
      });
    }, 30_000);
    return () => clearInterval(id);
  }, [log.interval]);

  const scheduleSave = useCallback((next: TimeLog) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await saveTimeLog(next);
      } catch (error) {
        console.error('Failed to save time log:', error);
      }
      debounceRef.current = null;
    }, 600);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateLog = (mutator: (prev: TimeLog) => TimeLog) => {
    setLog((prev) => {
      const next = { ...mutator(prev), updatedAt: Date.now() };
      scheduleSave(next);
      return next;
    });
  };

  const slot: TimeLogSlot = log.slots[nowKey] ?? { activity: '', baseline: 0 };

  const handleActivityChange = (value: string) => {
    updateLog((prev) => {
      const existing = prev.slots[nowKey] ?? { activity: '', baseline: 0 };
      const nextSlot: TimeLogSlot = { ...existing, activity: value };
      const slots = { ...prev.slots };
      if (!nextSlot.activity && !nextSlot.baseline) delete slots[nowKey];
      else slots[nowKey] = nextSlot;
      return { ...prev, slots };
    });
  };

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
    setPopoverAnchor(null);
  }, []);

  const handleBaselinePick = (n: number) => {
    updateLog((prev) => {
      const existing = prev.slots[nowKey] ?? { activity: '', baseline: 0 };
      const nextBaseline = existing.baseline === n ? 0 : n;
      const nextSlot: TimeLogSlot = { ...existing, baseline: nextBaseline };
      const slots = { ...prev.slots };
      if (!nextSlot.activity && !nextSlot.baseline) delete slots[nowKey];
      else slots[nowKey] = nextSlot;
      return { ...prev, slots };
    });
    closePopover();
  };

  const handleIntervalToggle = (interval: TimeLogInterval) => {
    if (interval === log.interval) return;
    updateLog((prev) => ({ ...prev, interval }));
    setNowKey(computeNowKey(interval));
  };

  const handleCircleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (popoverOpen) {
      closePopover();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverAnchor({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setPopoverOpen(true);
  };

  useEffect(() => {
    if (!popoverOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest(`.${styles.timeLogBaselinePopover}`)) return;
      if (t.closest(`.${styles.timeLogBaselineCircle}`)) return;
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
  }, [popoverOpen, closePopover]);

  return (
    <section className={styles.timeLogSection}>
      <div className={styles.timeLogCard}>
        <div className={styles.timeLogHeader}>
          <span className={styles.timeLogTitle}>{'// TIME LOG'}</span>
          <div className={styles.timeLogIntervalToggle}>
            <button
              type="button"
              className={`${styles.timeLogIntervalBtn} ${log.interval === 60 ? styles.timeLogIntervalBtnActive : ''}`}
              onClick={() => handleIntervalToggle(60)}
            >
              1 HR
            </button>
            <button
              type="button"
              className={`${styles.timeLogIntervalBtn} ${log.interval === 15 ? styles.timeLogIntervalBtnActive : ''}`}
              onClick={() => handleIntervalToggle(15)}
            >
              15 MIN
            </button>
          </div>
        </div>
        <div className={styles.timeLogSlotRow}>
          <span className={styles.timeLogSlotLabel}>{formatSlotRange(nowKey, log.interval)}</span>
          <input
            type="text"
            className={styles.timeLogActivity}
            placeholder="What are you doing right now?"
            value={loaded ? slot.activity : ''}
            onChange={(e) => handleActivityChange(e.target.value)}
            onFocus={() => {
              activityFocusedRef.current = true;
            }}
            onBlur={() => {
              activityFocusedRef.current = false;
            }}
            disabled={!loaded}
          />
          <button
            type="button"
            aria-label={slot.baseline ? `Baseline ${slot.baseline}` : 'Set emotional baseline'}
            aria-expanded={popoverOpen}
            className={`${styles.timeLogBaselineCircle} ${styles[`timeLogBaselineTier_${baselineTier(slot.baseline)}`]}`}
            onClick={handleCircleClick}
            disabled={!loaded}
          >
            {slot.baseline || '—'}
          </button>
        </div>
      </div>

      {popoverOpen && popoverAnchor && (
        <div
          className={styles.timeLogBaselinePopover}
          style={{ top: popoverAnchor.top, right: popoverAnchor.right }}
          role="dialog"
          aria-label="Pick emotional baseline"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const tier = baselineTier(n);
            const active = slot.baseline === n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`Baseline ${n}`}
                aria-pressed={active}
                className={`${styles.timeLogBaselineOption} ${styles[`timeLogBaselineTier_${tier}`]} ${active ? styles.timeLogBaselineOptionActive : ''}`}
                onClick={() => handleBaselinePick(n)}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
