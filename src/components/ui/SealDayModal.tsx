'use client';

import { useEffect, useRef } from 'react';
import styles from './preset-sync-modal.module.css';

interface SealDayModalProps {
  isOpen: boolean;
  operatorPct: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SealDayModal({
  isOpen,
  operatorPct,
  onConfirm,
  onCancel,
}: SealDayModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onCancel}></div>
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Seal this day?</h3>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            This locks today&apos;s plan and cannot be undone.
          </p>
          {operatorPct < 100 && (
            <p className={styles.warningText}>
              You&apos;re sealing at {operatorPct}%. This cannot be undone.
            </p>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            Seal Day
          </button>
        </div>
      </div>
    </>
  );
}

