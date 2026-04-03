'use client';

import { useState, useEffect, useRef } from 'react';

interface EditTaskModalProps {
  open: boolean;
  initialText: string;
  initialTime: string;
  onSubmit: (text: string, time: string) => void;
  onCancel: () => void;
}

export default function EditTaskModal({
  open,
  initialText,
  initialTime,
  onSubmit,
  onCancel,
}: EditTaskModalProps) {
  const [text, setText] = useState(initialText);
  const [time, setTime] = useState(initialTime);
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setTime(initialTime);
      setTimeout(() => textRef.current?.focus(), 0);
    }
  }, [open, initialText, initialTime]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(text.trim() || initialText, time || initialTime);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#1c1917',
          border: '1px solid #292524',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 1rem', color: '#e7e5e4', fontSize: '1rem' }}>
          Edit Task
        </h3>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', color: '#a8a29e', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            Task name
          </label>
          <input
            ref={textRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: '#0c0a09',
              color: '#e7e5e4',
              border: '1px solid #292524',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <label style={{ display: 'block', color: '#a8a29e', fontSize: '0.75rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}>
            Time (HH:MM)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: '#0c0a09',
              color: '#e7e5e4',
              border: '1px solid #292524',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.4rem 1rem',
                background: 'transparent',
                color: '#a8a29e',
                border: '1px solid #292524',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.4rem 1rem',
                background: '#166534',
                color: '#bbf7d0',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
