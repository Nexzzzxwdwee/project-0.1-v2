/**
 * Mock tasks data - placeholder only
 */

export interface MockTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority: 'high' | 'medium' | 'low';
}

export const mockTasks: MockTask[] = [
  {
    id: '1',
    title: 'Complete project documentation',
    completed: false,
    dueDate: '2026-01-10',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Review code changes',
    completed: false,
    dueDate: '2026-01-10',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Team meeting preparation',
    completed: true,
    dueDate: '2026-01-09',
    priority: 'low',
  },
];

