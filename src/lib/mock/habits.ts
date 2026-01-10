/**
 * Mock habits data - placeholder only
 */

export interface MockHabit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompleted: string | null;
}

export const mockHabits: MockHabit[] = [
  {
    id: '1',
    name: 'Morning Exercise',
    frequency: 'daily',
    streak: 7,
    lastCompleted: '2026-01-09',
  },
  {
    id: '2',
    name: 'Read for 30 minutes',
    frequency: 'daily',
    streak: 5,
    lastCompleted: '2026-01-09',
  },
  {
    id: '3',
    name: 'Meditation',
    frequency: 'daily',
    streak: 3,
    lastCompleted: '2026-01-09',
  },
];

