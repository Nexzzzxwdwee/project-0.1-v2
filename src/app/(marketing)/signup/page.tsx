export default function SignupPage() {
  return (
    <main>
      <h1>Sign Up</h1>
      <p>Signup page placeholder - Phase 2 UI only</p>
      <p>No auth logic, no backend, no API calls.</p>
      <form style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email: </label>
          <input type="email" placeholder="email@example.com" style={{ padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password: </label>
          <input type="password" placeholder="password" style={{ padding: '0.5rem' }} />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Sign Up (Placeholder)
        </button>
      </form>
    </main>
  );
}

