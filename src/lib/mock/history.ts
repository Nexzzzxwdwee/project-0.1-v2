/**
 * Mock history data - placeholder only
 */

export interface MockHistoryEntry {
  id: string;
  date: string;
  habitsCompleted: number;
  tasksCompleted: number;
  totalHabits: number;
  totalTasks: number;
}

export const mockHistory: MockHistoryEntry[] = [
  {
    id: '1',
    date: '2026-01-09',
    habitsCompleted: 3,
    tasksCompleted: 2,
    totalHabits: 3,
    totalTasks: 3,
  },
  {
    id: '2',
    date: '2026-01-08',
    habitsCompleted: 2,
    tasksCompleted: 1,
    totalHabits: 3,
    totalTasks: 2,
  },
  {
    id: '3',
    date: '2026-01-07',
    habitsCompleted: 3,
    tasksCompleted: 3,
    totalHabits: 3,
    totalTasks: 3,
  },
];

