'use client';

// Error boundary for the public marketing pages, so a visitor never sees a raw
// Next.js stack trace. Matches the (app)/error.tsx convention.
import { useEffect } from 'react';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Marketing Error]', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        color: '#AAAAAA',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <h2 style={{ color: '#E0002B', fontSize: '1.25rem', margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ margin: 0, maxWidth: '400px', lineHeight: 1.5 }}>
        An unexpected error occurred. Please try again.
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
    </div>
  );
}
