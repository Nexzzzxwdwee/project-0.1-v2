import Link from 'next/link';

export function SidebarNav() {
  return (
    <aside
      style={{
        width: '200px',
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        borderRight: '1px solid #ddd',
      }}
    >
      <nav>
        <ul style={{ listStyle: 'none' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/today">Today</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/habits">Habits</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/history">History</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/weekly">Weekly</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/settings">Settings</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

