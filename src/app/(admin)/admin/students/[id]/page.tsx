'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  getStudentProfile,
  listNotesForStudent,
  createMentorNote,
  listFlagsForStudent,
  createFlag,
  resolveFlag,
} from '@/lib/mentor';
import type {
  Profile,
  MentorNote,
  MentorNoteEntryType,
  Flag,
} from '@/lib/types';
import styles from './detail.module.css';

type Section = 'overview' | 'journal' | 'goals' | 'habits' | 'time_log';

interface JournalRow {
  id: string;
  date: string;
  content: string;
  updatedAt: number;
}

interface GoalRow {
  id: string;
  text: string;
  tag: string | null;
  done: boolean;
  doneAt: number | null;
  createdAt: number;
}

interface ProgressRow {
  currentStreak: number;
  bestStreak: number;
  xp: number;
  rank: string;
}

interface SummaryRow {
  date: string;
  operatorPct: number;
  operatorDone: number;
  operatorTotal: number;
}

interface TimeLogRow {
  date: string;
  intervalMinutes: number;
  slots: Record<string, { activity: string; baseline: number }>;
  wins: string;
  learnt: string;
  tomorrow: string;
  notes: string;
}

interface PresetItem {
  id: string;
  text: string;
}

interface PresetRow {
  id: string;
  name: string;
  habits: PresetItem[];
  tasks: PresetItem[];
}

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function entryTypeForSection(section: Section): MentorNoteEntryType {
  switch (section) {
    case 'journal': return 'journal';
    case 'goals': return 'goal';
    case 'habits': return 'habit';
    case 'time_log': return 'time_log';
    default: return 'general';
  }
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const studentId = params.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('overview');

  const [progress, setProgress] = useState<ProgressRow | null>(null);
  const [todaySummary, setTodaySummary] = useState<SummaryRow | null>(null);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [presets, setPresets] = useState<PresetRow[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLogRow[]>([]);
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);

  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagSaving, setFlagSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error('Supabase not configured');

        const today = getTodayDateString();

        const [p, prog, sum, jrnl, gls, prs, tlogs, mentorNotes, flagsRes] = await Promise.all([
          getStudentProfile(studentId),
          supabase.from('user_progress').select('*').eq('user_id', studentId).maybeSingle(),
          supabase
            .from('day_summaries')
            .select('*')
            .eq('user_id', studentId)
            .eq('date', today)
            .maybeSingle(),
          supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', studentId)
            .order('updated_at', { ascending: false })
            .limit(50),
          supabase
            .from('goals')
            .select('*')
            .eq('user_id', studentId)
            .order('updated_at', { ascending: false }),
          supabase.from('presets').select('*').eq('user_id', studentId),
          supabase
            .from('time_logs')
            .select('*')
            .eq('user_id', studentId)
            .order('date', { ascending: false })
            .limit(14),
          listNotesForStudent(studentId),
          listFlagsForStudent(studentId),
        ]);

        if (cancelled) return;

        if (!p) {
          setError('Student not found.');
          setLoaded(true);
          return;
        }
        setProfile(p);

        if (prog.data) {
          setProgress({
            currentStreak: prog.data.current_streak ?? 0,
            bestStreak: prog.data.best_streak ?? 0,
            xp: prog.data.xp ?? 0,
            rank: prog.data.rank ?? 'Recruit',
          });
        }
        if (sum.data) {
          setTodaySummary({
            date: sum.data.date,
            operatorPct: sum.data.operator_pct ?? 0,
            operatorDone: sum.data.operator_done ?? 0,
            operatorTotal: sum.data.operator_total ?? 0,
          });
        }
        setJournal(
          (jrnl.data || []).map((r) => ({
            id: r.id,
            date: r.date,
            content: r.content || '',
            updatedAt: r.updated_at ?? 0,
          })),
        );
        setGoals(
          (gls.data || []).map((r) => ({
            id: r.id,
            text: r.text,
            tag: r.tag,
            done: r.done,
            doneAt: r.done_at,
            createdAt: r.created_at,
          })),
        );
        setPresets(
          (prs.data || []).map((r) => ({
            id: r.id,
            name: r.name,
            habits: (r.habits || []) as PresetItem[],
            tasks: (r.tasks || []) as PresetItem[],
          })),
        );
        setTimeLogs(
          (tlogs.data || []).map((r) => ({
            date: r.date,
            intervalMinutes: r.interval_minutes ?? 60,
            slots: (r.slots || {}) as Record<string, { activity: string; baseline: number }>,
            wins: r.wins || '',
            learnt: r.learnt || '',
            tomorrow: r.tomorrow || '',
            notes: r.notes || '',
          })),
        );
        setNotes(mentorNotes);
        setFlags(flagsRes);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Failed to load student data.');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const handleSaveNote = async () => {
    const text = noteText.trim();
    if (!text || !profile) return;
    setNoteSaving(true);
    try {
      const note = await createMentorNote({
        studentId: profile.id,
        noteText: text,
        entryType: entryTypeForSection(section),
      });
      setNotes((prev) => [note, ...prev]);
      setNoteText('');
    } catch (err) {
      console.error(err);
      setError('Failed to save mentor note.');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSaveFlag = async () => {
    const reason = flagReason.trim();
    if (!reason || !profile) return;
    setFlagSaving(true);
    try {
      const flag = await createFlag(profile.id, reason);
      setFlags((prev) => [flag, ...prev]);
      setFlagReason('');
      setFlagOpen(false);
    } catch (err) {
      console.error(err);
      setError('Failed to create flag.');
    } finally {
      setFlagSaving(false);
    }
  };

  const handleResolveFlag = async (flagId: string) => {
    try {
      await resolveFlag(flagId);
      setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, resolved: true } : f)));
    } catch (err) {
      console.error(err);
      setError('Failed to resolve flag.');
    }
  };

  if (!loaded) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (error && !profile) {
    return (
      <div>
        <Link href="/admin" className={styles.backLink}>← Back to roster</Link>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const openFlagCount = flags.filter((f) => !f.resolved).length;
  const notesForSection = notes.filter((n) => n.entryType === entryTypeForSection(section) || section === 'overview');

  return (
    <div>
      <Link href="/admin" className={styles.backLink}>← Back to roster</Link>

      <header className={styles.header}>
        <div>
          <span className={styles.accent}>{'// OPERATOR PROFILE'}</span>
          <h1 className={styles.title}>
            {profile.displayName || profile.email || profile.id.slice(0, 8)}
          </h1>
          <div className={styles.metaRow}>
            {profile.email && <span className={styles.metaItem}>{profile.email}</span>}
            <span className={styles.metaItem}>Joined {formatDate(profile.createdAt)}</span>
            <span className={styles.metaItem}>Last active {formatDate(profile.lastActiveAt)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {openFlagCount > 0 && <span className={styles.flagPill}>{openFlagCount} OPEN FLAG{openFlagCount === 1 ? '' : 'S'}</span>}
          <button
            type="button"
            className={styles.flagBtn}
            onClick={() => setFlagOpen(true)}
          >
            Flag Student
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      <nav className={styles.tabs}>
        {([
          ['overview', 'Overview'],
          ['journal', 'Journal'],
          ['goals', 'Goals'],
          ['habits', 'Habits'],
          ['time_log', 'Time Tracker'],
        ] as [Section, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${styles.tab} ${section === key ? styles.tabActive : ''}`}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className={styles.grid}>
        <div className={styles.content}>
          {section === 'overview' && (
            <>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Streak</span>
                  <span className={styles.statValue}>{progress?.currentStreak ?? 0}d</span>
                  <span className={styles.statSub}>best {progress?.bestStreak ?? 0}d</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Total XP</span>
                  <span className={styles.statValue}>{progress?.xp ?? 0}</span>
                  <span className={styles.statSub}>{progress?.rank ?? 'Recruit'}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Today</span>
                  <span className={styles.statValue}>
                    {todaySummary ? `${todaySummary.operatorPct}%` : '—'}
                  </span>
                  <span className={styles.statSub}>
                    {todaySummary
                      ? `${todaySummary.operatorDone}/${todaySummary.operatorTotal} ops`
                      : 'Not sealed'}
                  </span>
                </div>
              </div>

              <section className={styles.subsection}>
                <h2 className={styles.subTitle}>Open Flags</h2>
                {flags.filter((f) => !f.resolved).length === 0 ? (
                  <p className={styles.empty}>No open flags.</p>
                ) : (
                  <ul className={styles.flagList}>
                    {flags.filter((f) => !f.resolved).map((flag) => (
                      <li key={flag.id} className={styles.flagItem}>
                        <div className={styles.flagItemHead}>
                          <span className={styles.flagItemDate}>{formatDate(flag.createdAt)}</span>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => handleResolveFlag(flag.id)}
                          >
                            Resolve
                          </button>
                        </div>
                        <p className={styles.flagItemBody}>{flag.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {section === 'journal' && (
            <section className={styles.subsection}>
              <h2 className={styles.subTitle}>Journal Entries</h2>
              {journal.length === 0 ? (
                <p className={styles.empty}>No journal entries yet.</p>
              ) : (
                <ul className={styles.journalList}>
                  {journal.map((e) => (
                    <li key={e.id} className={styles.journalItem}>
                      <div className={styles.journalHead}>{formatDateOnly(e.date)}</div>
                      <p className={styles.journalBody}>
                        {e.content.trim() || <em className={styles.empty}>(empty entry)</em>}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {section === 'goals' && (
            <section className={styles.subsection}>
              <h2 className={styles.subTitle}>Goals</h2>
              {goals.length === 0 ? (
                <p className={styles.empty}>No goals yet.</p>
              ) : (
                <ul className={styles.goalList}>
                  {goals.map((g) => (
                    <li key={g.id} className={`${styles.goalItem} ${g.done ? styles.goalDone : ''}`}>
                      <span className={styles.goalMark}>{g.done ? '✓' : '○'}</span>
                      <div className={styles.goalBody}>
                        <span className={styles.goalText}>{g.text}</span>
                        {g.tag && <span className={styles.goalTag}>{g.tag}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {section === 'habits' && (
            <section className={styles.subsection}>
              <h2 className={styles.subTitle}>Habit Presets</h2>
              {presets.length === 0 ? (
                <p className={styles.empty}>No habit presets configured.</p>
              ) : (
                presets.map((p) => (
                  <div key={p.id} className={styles.presetCard}>
                    <h3 className={styles.presetName}>{p.name}</h3>
                    <div className={styles.presetCols}>
                      <div>
                        <span className={styles.presetColLabel}>Habits</span>
                        {p.habits.length === 0 ? (
                          <p className={styles.empty}>None</p>
                        ) : (
                          <ul className={styles.presetItems}>
                            {p.habits.map((h) => (
                              <li key={h.id}>{h.text}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <span className={styles.presetColLabel}>Tasks</span>
                        {p.tasks.length === 0 ? (
                          <p className={styles.empty}>None</p>
                        ) : (
                          <ul className={styles.presetItems}>
                            {p.tasks.map((t) => (
                              <li key={t.id}>{t.text}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {section === 'time_log' && (
            <section className={styles.subsection}>
              <h2 className={styles.subTitle}>Time Tracker (last 14 days)</h2>
              {timeLogs.length === 0 ? (
                <p className={styles.empty}>No time logs yet.</p>
              ) : (
                timeLogs.map((log) => {
                  const filled = Object.entries(log.slots).filter(
                    ([, s]) => s.activity || s.baseline,
                  );
                  return (
                    <div key={log.date} className={styles.timeLogCard}>
                      <div className={styles.timeLogHead}>
                        <span>{formatDateOnly(log.date)}</span>
                        <span className={styles.muted}>{log.intervalMinutes}min</span>
                      </div>
                      {filled.length === 0 ? (
                        <p className={styles.empty}>No entries.</p>
                      ) : (
                        <ul className={styles.slotList}>
                          {filled
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([key, slot]) => (
                              <li key={key} className={styles.slotItem}>
                                <span className={styles.slotKey}>{key}</span>
                                <span className={styles.slotActivity}>
                                  {slot.activity || <em className={styles.muted}>—</em>}
                                </span>
                                {slot.baseline > 0 && (
                                  <span className={styles.slotBaseline}>{slot.baseline}/10</span>
                                )}
                              </li>
                            ))}
                        </ul>
                      )}
                      {(log.wins || log.learnt || log.tomorrow || log.notes) && (
                        <div className={styles.timeLogSummary}>
                          {log.wins && <p><strong>Wins:</strong> {log.wins}</p>}
                          {log.learnt && <p><strong>Learnt:</strong> {log.learnt}</p>}
                          {log.tomorrow && <p><strong>Tomorrow:</strong> {log.tomorrow}</p>}
                          {log.notes && <p><strong>Notes:</strong> {log.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.noteSection}>
            <h2 className={styles.subTitle}>Leave Mentor Note</h2>
            <p className={styles.helperText}>
              Tagged to <strong>{section === 'overview' ? 'General' : section.replace('_', ' ')}</strong>. Student will see this as new feedback.
            </p>
            <textarea
              className={styles.noteInput}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write feedback the student should read…"
              rows={5}
              disabled={noteSaving}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSaveNote}
              disabled={noteSaving || !noteText.trim()}
            >
              {noteSaving ? 'Saving…' : 'Send Note'}
            </button>
          </section>

          <section className={styles.notesList}>
            <h2 className={styles.subTitle}>Previous Notes</h2>
            {notesForSection.length === 0 ? (
              <p className={styles.empty}>No notes yet for this section.</p>
            ) : (
              <ul className={styles.notesUl}>
                {notesForSection.slice(0, 20).map((n) => (
                  <li key={n.id} className={styles.notesItem}>
                    <div className={styles.notesHead}>
                      <span className={styles.notesType}>{n.entryType}</span>
                      <span className={styles.notesDate}>{formatDate(n.createdAt)}</span>
                      {n.isRead && <span className={styles.notesRead}>read</span>}
                    </div>
                    <p className={styles.notesBody}>{n.noteText}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {flagOpen && (
        <div className={styles.modalOverlay} onClick={() => setFlagOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Flag {profile.displayName || 'student'}</h3>
            <p className={styles.modalSubtitle}>
              Internal note — student cannot see flags. Use for tracking concerns.
            </p>
            <textarea
              className={styles.noteInput}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Reason for flagging…"
              rows={4}
              disabled={flagSaving}
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => setFlagOpen(false)}
                disabled={flagSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.flagBtn}
                onClick={handleSaveFlag}
                disabled={flagSaving || !flagReason.trim()}
              >
                {flagSaving ? 'Saving…' : 'Add Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
