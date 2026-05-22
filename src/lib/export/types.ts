/**
 * Export payload — the canonical shape returned by /api/export/* routes.
 * Used by both JSON download and CSV/ZIP conversion on the client.
 */

export interface ExportProfile {
  id: string;
  displayName: string | null;
  email: string | null;
  role: string;
  joinDate: string;
  currentRank: string;
  currentXp: number;
  xpToNext: number;
  currentStreak: number;
  bestStreak: number;
}

export interface ExportDailyLogItem {
  name: string;
  completed: boolean;
}

export interface ExportDeepWorkEntry {
  activity: string;
  durationMinutes: number;
}

export interface ExportJournalEntry {
  time: string;
  text: string;
}

export interface ExportDailyLog {
  date: string;
  operatorScore: number | null;
  habits: ExportDailyLogItem[];
  tasks: ExportDailyLogItem[];
  deepWork: ExportDeepWorkEntry[];
  journalEntries: ExportJournalEntry[];
  sealed: boolean;
}

export interface ExportTimeTrackerSlot {
  time: string;
  activity: string;
  baseline: number;
}

export interface ExportTimeTracker {
  date: string;
  intervalMinutes: number;
  slots: ExportTimeTrackerSlot[];
  wins: string;
  learnt: string;
  tomorrow: string;
  notes: string;
}

export interface ExportJournal {
  date: string;
  content: string;
  wordCount: number;
}

export interface ExportGoal {
  text: string;
  tag: string | null;
  status: 'active' | 'completed';
  createdAt: string;
  completedAt: string | null;
}

export interface ExportHabitHistoryEntry {
  date: string;
  completed: boolean;
}

export interface ExportHabit {
  name: string;
  firstSeen: string;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  history: ExportHabitHistoryEntry[];
}

export interface ExportMentorNote {
  receivedAt: string;
  noteText: string;
  entryType: string;
}

export interface ExportPayload {
  exportedAt: string;
  profile: ExportProfile;
  dailyLogs: ExportDailyLog[];
  timeTracker: ExportTimeTracker[];
  journal: ExportJournal[];
  goals: ExportGoal[];
  habits: ExportHabit[];
  mentorNotes: ExportMentorNote[];
}
