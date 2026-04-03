'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './preset-sync-modal.module.css';

interface DeletePresetModalProps {
  isOpen: boolean;
  presetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeletePresetModal({
  isOpen,
  presetName,
  onConfirm,
  onCancel,
}: DeletePresetModalProps) {
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
          <h3 className={styles.title}>Delete Preset</h3>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            Delete preset &quot;{presetName}&quot;? This cannot be undone.
          </p>
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
            style={{ background: '#ef4444', borderColor: '#ef4444' }}
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

