'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import styles from '../initialize/initialize.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError('Supabase is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Success - redirect to onboarding (or let callback handle if email confirmation required)
      router.push('/onboarding');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className={styles.mainContent}>
      {/* Background Atmosphere */}
      <div className={styles.bgAtmosphere}>
        <div className={styles.gridPattern}></div>
        <div className={styles.radialGlow1}></div>
        <div className={styles.radialGlow2}></div>
        <div className={styles.noiseTexture}></div>
      </div>

      {/* Main Auth Container */}
      <div className={styles.containerAuth}>
        {/* Brand Header */}
        <div className={styles.headerBrand}>
          <h1 className={styles.brandTitle}>Project 0.1</h1>
          <p className={styles.brandSubtitle}>v0.1.4-beta // Create Account</p>
        </div>

        {/* Auth Card */}
        <div className={styles.cardAuthMain}>
          <div className={styles.accentLine}></div>

          <div className={styles.formContent}>
            <form className={styles.formLogin} onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  color: '#ef4444',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIconLeft}>
                    <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                      <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.4 40.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.6 152.4C504.9 141.3 512 127.1 512 112c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    className={styles.textInput}
                    placeholder="user@project01.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className={styles.fieldGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIconLeft}>
                    <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                      <path d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    className={styles.textInput}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={loading}
              >
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
