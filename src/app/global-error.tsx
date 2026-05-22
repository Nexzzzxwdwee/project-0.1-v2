'use client';

// Root safety net: catches errors thrown in the root layout or anywhere not
// covered by a nested error boundary. It replaces the whole document, so it
// must render its own <html>/<body> and can't rely on globals.css — styles are
// inlined to keep the red/black theme even when the app shell failed to load.
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          background: '#080808',
          color: '#AAAAAA',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#E0002B', fontSize: '1.5rem', margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
          An unexpected error occurred. Try again, and if it keeps happening,
          reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1.5rem',
            background: '#E0002B',
            color: '#080808',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
