'use client';

import { useEffect, useState } from 'react';
import { getMyMentorNotes, markAllNotesRead } from '@/lib/mentor';
import type { MentorNote, MentorNoteEntryType } from '@/lib/types';
import styles from './feedback.module.css';

const ENTRY_TYPE_LABEL: Record<MentorNoteEntryType, string> = {
  journal: 'Journal',
  goal: 'Goals',
  habit: 'Habits',
  time_log: 'Time Tracker',
  general: 'General',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FeedbackPage() {
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyMentorNotes();
        if (cancelled) return;
        setNotes(data);
        setLoaded(true);
        // Mark unread notes as read after a short visible delay so the badge
        // doesn't visibly tick before the user can see what's new.
        if (data.some((n) => !n.isRead)) {
          setTimeout(() => {
            markAllNotesRead().catch(() => { /* ignore */ });
          }, 800);
        }
      } catch (err) {
        if (cancelled) return;
        setError('Could not load mentor notes.');
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.titleAccent}>{'// MENTOR INTEL'}</span>
        <h1 className={styles.title}>
          <span className={styles.titleGradient}>Mentor Intel</span>
        </h1>
        <p className={styles.subtitle}>
          Notes from your admin. One-way — but read them carefully.
        </p>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loaded && notes.length === 0 && !error && (
        <div className={styles.empty}>
          <p>No mentor notes yet. When your admin leaves feedback, it will show up here.</p>
        </div>
      )}

      <div className={styles.list}>
        {notes.map((note) => (
          <article
            key={note.id}
            className={`${styles.note} ${!note.isRead ? styles.noteUnread : ''}`}
          >
            <header className={styles.noteHeader}>
              <span className={styles.noteType}>{ENTRY_TYPE_LABEL[note.entryType]}</span>
              <span className={styles.noteDate}>{formatTimestamp(note.createdAt)}</span>
              {!note.isRead && <span className={styles.noteNew}>NEW</span>}
            </header>
            <p className={styles.noteBody}>{note.noteText}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
