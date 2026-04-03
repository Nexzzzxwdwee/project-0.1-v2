'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './time-picker.module.css';

interface TimePickerProps {
  value: string; // Format: "hh:mm AM/PM" (12-hour) or empty string
  onChange: (time: string) => void; // Returns "hh:mm AM/PM" format
  className?: string;
  placeholder?: string;
}

export default function TimePicker({
  value,
  onChange,
  className,
  placeholder = 'Set time',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Parse 12h format "hh:mm AM/PM" to internal state
  useEffect(() => {
    if (value) {
      // Parse format like "08:00 AM" or "8:00 PM"
      const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const period = match[3].toUpperCase() as 'AM' | 'PM';
        setHour(h);
        setMinute(m);
        setAmpm(period);
      } else {
        // Fallback: try to parse as 24h format for backward compatibility
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const hour24 = hours || 9;
          const hour12 = hour24 % 12 || 12;
          setHour(hour12);
          setMinute(minutes || 0);
          setAmpm(hour24 >= 12 ? 'PM' : 'AM');
        }
      }
    } else {
      setHour(9);
      setMinute(0);
      setAmpm('AM');
    }
  }, [value]);

  // Convert to 12h display format "hh:mm AM/PM"
  const to12h = (h: number, m: number, period: 'AM' | 'PM'): string => {
    const hourStr = String(h).padStart(2, '0');
    const minuteStr = String(m).padStart(2, '0');
    return `${hourStr}:${minuteStr} ${period}`;
  };

  const handleSet = () => {
    const time12h = to12h(hour, minute, ampm);
    onChange(time12h);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    // Reset to current value
    if (value) {
      const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const period = match[3].toUpperCase() as 'AM' | 'PM';
        setHour(h);
        setMinute(m);
        setAmpm(period);
      }
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, value]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, value]);

  const displayValue = value || placeholder;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={styles.timePickerWrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.timePickerTrigger} ${className || ''} ${!value ? styles.timePickerPlaceholder : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select time"
      >
        <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
          <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
        </svg>
        <span className={styles.timePickerValue}>{displayValue}</span>
      </button>

      {isOpen && (
        <>
          <div className={styles.timePickerOverlay} onClick={handleCancel}></div>
          <div ref={popoverRef} className={styles.timePickerPopover}>
            <div className={styles.timePickerHeader}>
              <h3 className={styles.timePickerTitle}>Select Time</h3>
            </div>

            <div className={styles.timePickerBody}>
              <div className={styles.timePickerColumn}>
                <label className={styles.timePickerLabel}>Hour</label>
                <div className={styles.timePickerScroll}>
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`${styles.timePickerOption} ${hour === h ? styles.timePickerOptionActive : ''}`}
                      onClick={() => setHour(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.timePickerColumn}>
                <label className={styles.timePickerLabel}>Minute</label>
                <div className={styles.timePickerScroll}>
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.timePickerOption} ${minute === m ? styles.timePickerOptionActive : ''}`}
                      onClick={() => setMinute(m)}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.timePickerColumn}>
                <label className={styles.timePickerLabel}>Period</label>
                <div className={styles.timePickerScroll}>
                  <button
                    type="button"
                    className={`${styles.timePickerOption} ${ampm === 'AM' ? styles.timePickerOptionActive : ''}`}
                    onClick={() => setAmpm('AM')}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`${styles.timePickerOption} ${ampm === 'PM' ? styles.timePickerOptionActive : ''}`}
                    onClick={() => setAmpm('PM')}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.timePickerFooter}>
              <button
                type="button"
                className={styles.timePickerCancel}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.timePickerSet}
                onClick={handleSet}
              >
                Set
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

