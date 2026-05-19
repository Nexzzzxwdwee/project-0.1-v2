'use client';

import { useState } from 'react';
import {
  fetchExport,
  downloadJson,
  downloadCsvZip,
} from '@/lib/export/client';
import styles from './ExportButtons.module.css';

type Mode = { kind: 'self' } | { kind: 'student'; studentId: string };

interface Props {
  mode: Mode;
  label?: string;
  description?: string;
  className?: string;
}

export default function ExportButtons({
  mode,
  label = '// DATA EXPORT',
  description = 'Download a full copy of your Operators data.',
  className,
}: Props) {
  const [busy, setBusy] = useState<null | 'json' | 'csv'>(null);
  const [error, setError] = useState<string | null>(null);

  const endpoint =
    mode.kind === 'self'
      ? '/api/export/me'
      : (`/api/export/student/${mode.studentId}` as const);

  const handleExport = async (format: 'json' | 'csv') => {
    setBusy(format);
    setError(null);
    try {
      const { payload, slug } = await fetchExport(endpoint);
      if (format === 'json') {
        downloadJson(payload, slug);
      } else {
        await downloadCsvZip(payload, slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`${styles.section} ${className ?? ''}`}>
      <span className={styles.label}>{label}</span>
      <p className={styles.description}>{description}</p>
      <div className={styles.buttonsRow}>
        <button
          type="button"
          className={styles.button}
          onClick={() => handleExport('json')}
          disabled={busy !== null}
        >
          {busy === 'json' && <span className={styles.spinner} aria-hidden />}
          {busy === 'json' ? 'Preparing…' : 'Export as JSON'}
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => handleExport('csv')}
          disabled={busy !== null}
        >
          {busy === 'csv' && <span className={styles.spinner} aria-hidden />}
          {busy === 'csv' ? 'Preparing…' : 'Export as CSV (ZIP)'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
