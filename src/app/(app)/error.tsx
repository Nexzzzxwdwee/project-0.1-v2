'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
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
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.5rem',
          background: '#E0002B',
          color: '#FFB3C1',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        Try again
      </button>
    </div>
  );
}
