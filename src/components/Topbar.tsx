export function Topbar() {
  return (
    <header
      style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Project 0.1 v2</h2>
        <div>
          <span>User Placeholder</span>
        </div>
      </div>
    </header>
  );
}

