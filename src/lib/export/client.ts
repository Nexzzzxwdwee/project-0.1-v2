/**
 * Client-side download helpers for the export feature.
 * - downloadJson: pretty-printed .json
 * - downloadCsvZip: per-table .csv files bundled in a .zip
 */

import Papa from 'papaparse';
import JSZip from 'jszip';
import type { ExportPayload } from './types';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function buildExportFilename(slug: string, ext: 'json' | 'zip'): string {
  return `operators-export-${slug}-${todayDate()}.${ext}`;
}

export function downloadJson(payload: ExportPayload, slug: string): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, buildExportFilename(slug, 'json'));
}

export function downloadBulkJson(payload: unknown, slug: string): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, `operators-export-${slug}-${todayDate()}.json`);
}

export async function downloadCsvZip(payload: ExportPayload, slug: string): Promise<void> {
  const zip = new JSZip();

  zip.file('profile.csv', Papa.unparse([payload.profile]));

  const dailyLogsRows = payload.dailyLogs.map(d => ({
    date: d.date,
    operator_score: d.operatorScore ?? '',
    sealed: d.sealed,
    habits: d.habits.map(h => `${h.completed ? '[x]' : '[ ]'} ${h.name}`).join(' | '),
    tasks: d.tasks.map(t => `${t.completed ? '[x]' : '[ ]'} ${t.name}`).join(' | '),
    deep_work: d.deepWork.map(w => `${w.activity} (${w.durationMinutes}m)`).join(' | '),
  }));
  zip.file('daily-logs.csv', Papa.unparse(dailyLogsRows));

  const timeRows = payload.timeTracker.flatMap(t =>
    t.slots.map(slot => ({
      date: t.date,
      time: slot.time,
      interval_minutes: t.intervalMinutes,
      activity: slot.activity,
      baseline: slot.baseline,
      wins: t.wins,
      learnt: t.learnt,
      tomorrow: t.tomorrow,
      notes: t.notes,
    })),
  );
  zip.file('time-tracker.csv', Papa.unparse(timeRows));

  zip.file('journal.csv', Papa.unparse(payload.journal));
  zip.file('goals.csv', Papa.unparse(payload.goals));

  const habitsRows = payload.habits.map(h => ({
    name: h.name,
    first_seen: h.firstSeen,
    total_completions: h.totalCompletions,
    current_streak: h.currentStreak,
    longest_streak: h.longestStreak,
  }));
  zip.file('habits.csv', Papa.unparse(habitsRows));

  const habitHistoryRows = payload.habits.flatMap(h =>
    h.history.map(entry => ({
      habit_name: h.name,
      date: entry.date,
      completed: entry.completed,
    })),
  );
  zip.file('habit-history.csv', Papa.unparse(habitHistoryRows));

  zip.file('mentor-notes.csv', Papa.unparse(payload.mentorNotes));

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, buildExportFilename(slug, 'zip'));
}

/**
 * Fetch one of the export API routes and return the parsed payload + slug.
 */
export async function fetchExport(
  endpoint: '/api/export/me' | `/api/export/student/${string}`,
): Promise<{ payload: ExportPayload; slug: string }> {
  const res = await fetch(endpoint, { credentials: 'include' });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Export failed (${res.status})`);
  }
  return res.json();
}

export async function fetchBulkExport(): Promise<{ exportedAt: string; studentCount: number; students: ExportPayload[] }> {
  const res = await fetch('/api/export/all', { credentials: 'include' });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Bulk export failed (${res.status})`);
  }
  return res.json();
}
