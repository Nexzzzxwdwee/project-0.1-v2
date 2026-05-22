import Link from 'next/link';

// Root 404. Renders inside RootLayout, so globals.css (dark bg) is already
// applied; styles are inlined to match the existing error boundaries.
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        color: '#AAAAAA',
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: '#E0002B', fontSize: '2rem', margin: 0 }}>404</h1>
      <p style={{ margin: 0, maxWidth: '400px', lineHeight: 1.5 }}>
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.5rem',
          background: '#E0002B',
          color: '#080808',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        Go home
      </Link>
    </div>
  );
}
