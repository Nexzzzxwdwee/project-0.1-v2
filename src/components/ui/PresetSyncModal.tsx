'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './preset-sync-modal.module.css';

interface PresetSyncModalProps {
  isOpen: boolean;
  presetName: string;
  onConfirm: (options: { keepCompletion: boolean; keepManual: boolean }) => void;
  onCancel: () => void;
}

export default function PresetSyncModal({
  isOpen,
  presetName,
  onConfirm,
  onCancel,
}: PresetSyncModalProps) {
  const [keepCompletion, setKeepCompletion] = useState(true);
  const [keepManual, setKeepManual] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset to defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setKeepCompletion(true);
      setKeepManual(true);
    }
  }, [isOpen]);

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

  const handleConfirm = () => {
    onConfirm({ keepCompletion, keepManual });
  };

  return (
    <>
      <div className={styles.overlay} onClick={onCancel}></div>
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Sync from {presetName}?</h3>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            This will merge the preset into your day plan. Items removed from the preset will be archived.
          </p>

          <div className={styles.options}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={keepCompletion}
                onChange={(e) => setKeepCompletion(e.target.checked)}
              />
              <span className={styles.toggleText}>Keep completion states</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={keepManual}
                onChange={(e) => setKeepManual(e.target.checked)}
              />
              <span className={styles.toggleText}>Keep manual items</span>
            </label>
          </div>
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
            onClick={handleConfirm}
          >
            Sync
          </button>
        </div>
      </div>
    </>
  );
}

