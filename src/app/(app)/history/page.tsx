import { mockHistory } from '@/lib/mock/history';

export default function HistoryPage() {
  return (
    <main>
      <h1>History</h1>
      <p>History page placeholder - Phase 2 UI only</p>
      <section style={{ marginTop: '2rem' }}>
        <h2>Recent Activity</h2>
        <ul>
          {mockHistory.map((entry) => (
            <li key={entry.id} style={{ marginBottom: '1rem' }}>
              <strong>{entry.date}</strong> - Habits: {entry.habitsCompleted}/{entry.totalHabits},
              Tasks: {entry.tasksCompleted}/{entry.totalTasks}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

