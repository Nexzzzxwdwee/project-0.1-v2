'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './preset-sync-modal.module.css';

interface RenamePresetModalProps {
  isOpen: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export default function RenamePresetModal({
  isOpen,
  currentName,
  onConfirm,
  onCancel,
}: RenamePresetModalProps) {
  const [newName, setNewName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset to current name when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      // Focus input after a brief delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, currentName]);

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
    const trimmed = newName.trim();
    if (trimmed && trimmed !== currentName) {
      onConfirm(trimmed);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onCancel}></div>
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Rename Preset</h3>
        </div>

        <div className={styles.body}>
          <input
            ref={inputRef}
            type="text"
            className={styles.renameInput}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preset name"
            autoFocus
          />
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
            disabled={!newName.trim() || newName.trim() === currentName}
          >
            Rename
          </button>
        </div>
      </div>
    </>
  );
}

