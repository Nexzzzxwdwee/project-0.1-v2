import { mockHabits } from '@/lib/mock/habits';

export default function HabitsPage() {
  return (
    <main>
      <h1>Habits</h1>
      <p>Habits page placeholder - Phase 2 UI only</p>
      <section style={{ marginTop: '2rem' }}>
        <h2>Your Habits</h2>
        <ul>
          {mockHabits.map((habit) => (
            <li key={habit.id} style={{ marginBottom: '1rem' }}>
              <strong>{habit.name}</strong> - {habit.frequency} - Streak: {habit.streak} days
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

