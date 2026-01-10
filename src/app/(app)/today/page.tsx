import { mockTasks } from '@/lib/mock/tasks';

export default function TodayPage() {
  const todayTasks = mockTasks;

  return (
    <main>
      <h1>Today</h1>
      <p>Today page placeholder - Phase 2 UI only</p>
      <section style={{ marginTop: '2rem' }}>
        <h2>Tasks</h2>
        <ul>
          {todayTasks.map((task) => (
            <li key={task.id} style={{ marginBottom: '0.5rem' }}>
              {task.completed ? '✓' : '○'} {task.title} ({task.priority})
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

