'use client';

import { useState, useEffect } from 'react';
import styles from './interactive-checkbox.module.css';

interface InteractiveCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  /** When true, renders without label wrapper (for use inside another label) */
  noLabel?: boolean;
}

export default function InteractiveCheckbox({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  noLabel = false,
}: InteractiveCheckboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (checked) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 250);
      return () => clearTimeout(timer);
    }
  }, [checked]);

  const checkboxContent = (
    <>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={label}
        className={styles.input}
      />
      <span
        className={`${styles.box} ${checked ? styles.boxChecked : ''} ${isAnimating ? styles.boxAnimating : ''}`}
        aria-hidden="true"
      >
        {checked && (
          <svg
            className={`${styles.checkmark} ${isAnimating ? styles.checkmarkAnimating : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z"
              fill="currentColor"
            />
          </svg>
        )}
      </span>
    </>
  );

  if (noLabel) {
    return <span className={styles.label}>{checkboxContent}</span>;
  }

  return (
    <label className={styles.label} htmlFor={id}>
      {checkboxContent}
    </label>
  );
}

