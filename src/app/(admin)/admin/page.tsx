'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listStudents, setStudentActive, type StudentSummary } from '@/lib/mentor';
import BulkExportButton from '@/components/export/BulkExportButton';
import styles from './roster.module.css';

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminRosterPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const reload = async () => {
    try {
      const list = await listStudents();
      setStudents(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load students.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listStudents();
        if (cancelled) return;
        setStudents(list);
      } catch (err) {
        if (cancelled) return;
        setError('Failed to load students.');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleActive = async (studentId: string, nextValue: boolean) => {
    setBusyIds((s) => new Set(s).add(studentId));
    try {
      await setStudentActive(studentId, nextValue);
      await reload();
    } catch (err) {
      console.error(err);
      setError('Could not update student status.');
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(studentId);
        return next;
      });
    }
  };

  return (
    <div>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <span className={styles.accent}>{'// OPS COMMAND'}</span>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Student Roster</span>
          </h1>
          <p className={styles.subtitle}>
            Active operators under your mentorship. Click a row to open their detail view.
          </p>
        </div>
        <BulkExportButton />
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Operator</th>
              <th>Last Active</th>
              <th>Streak</th>
              <th>Today Score</th>
              <th>Flagged</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loaded && students.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No students yet. Generate an invite from the Invites tab.
                </td>
              </tr>
            )}
            {students.map((s) => {
              const scoreLabel =
                s.todayOperatorTotal != null
                  ? `${s.todayOperatorDone ?? 0} / ${s.todayOperatorTotal} (${s.todayOperatorPct ?? 0}%)`
                  : '—';
              return (
                <tr key={s.profile.id} className={!s.profile.isActive ? styles.inactiveRow : ''}>
                  <td>
                    <Link href={`/admin/students/${s.profile.id}`} className={styles.studentLink}>
                      <span className={styles.studentName}>
                        {s.profile.displayName || s.profile.email || s.profile.id.slice(0, 8)}
                      </span>
                      {s.profile.email && (
                        <span className={styles.studentEmail}>{s.profile.email}</span>
                      )}
                    </Link>
                  </td>
                  <td className={styles.mono}>{formatRelative(s.profile.lastActiveAt)}</td>
                  <td className={styles.mono}>{s.currentStreak}d</td>
                  <td className={styles.mono}>{scoreLabel}</td>
                  <td>
                    {s.isFlagged ? (
                      <span className={styles.flagBadge}>FLAGGED</span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.statusToggle} ${s.profile.isActive ? styles.statusOn : styles.statusOff}`}
                      onClick={() => handleToggleActive(s.profile.id, !s.profile.isActive)}
                      disabled={busyIds.has(s.profile.id)}
                    >
                      {s.profile.isActive ? 'ACTIVE' : 'REVOKED'}
                    </button>
                  </td>
                  <td>
                    <Link href={`/admin/students/${s.profile.id}`} className={styles.openLink}>
                      Open →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
