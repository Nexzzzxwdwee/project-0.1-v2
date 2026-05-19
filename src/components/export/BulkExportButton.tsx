'use client';

import { useState } from 'react';
import { fetchBulkExport, downloadBulkJson } from '@/lib/export/client';
import styles from './BulkExportButton.module.css';

export default function BulkExportButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await fetchBulkExport();
      downloadBulkJson(result, 'ALL');
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        Export All Students
      </button>

      {confirmOpen && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-export-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setConfirmOpen(false);
          }}
        >
          <div className={styles.modal}>
            <span className={styles.modalAccent}>{'// BULK EXPORT'}</span>
            <h2 id="bulk-export-title" className={styles.modalTitle}>
              Export every student&apos;s data?
            </h2>
            <p className={styles.modalBody}>
              This generates a single JSON file containing every active and
              inactive student&apos;s full profile, daily logs, time tracker,
              journal, goals, habits, and mentor notes. The download may be
              large if your roster has many students or long histories.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={busy}
              >
                {busy && <span className={styles.spinner} aria-hidden />}
                {busy ? 'Preparing…' : 'Generate Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
