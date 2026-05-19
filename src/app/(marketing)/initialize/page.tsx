'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import styles from './initialize.module.css';

function InitializeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    } else if (errorParam === 'supabase_not_configured') {
      setError('Authentication service is not available. Please contact support.');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
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
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.user) {
        setError(signInError?.message || 'Sign in failed.');
        setLoading(false);
        return;
      }

      // Look up role to decide where to land. Admin → /admin, student → /today.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', signInData.user.id)
        .maybeSingle();

      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        setError('Your account has been deactivated. Contact your admin.');
        setLoading(false);
        return;
      }

      router.push(profile?.role === 'admin' ? '/admin' : '/today');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = handleSignIn;

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
          <Link href="/" className={styles.brandIcon}>
            <img
              className={styles.brandLogoImg}
              src="/ttc-logo.png"
              alt="TTC"
            />
          </Link>
          <h1 className={styles.brandTitle}>OPERATORS</h1>
          <p className={styles.brandSubtitle}>by TTC &mdash; Invite Only</p>
        </div>

        {/* Auth Card */}
        <div className={styles.cardAuthMain}>
          <div className={styles.accentLine}></div>

          {/* Form Content */}
          <div className={styles.formContent}>
            <form className={styles.formLogin} onSubmit={handleSubmit}>
              {/* General Error Message */}
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
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.label}>
                    Password
                  </label>
                </div>
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
                  <button type="button" className={styles.inputIconRightButton} aria-label="Toggle password visibility">
                    <svg className={styles.icon} viewBox="0 0 576 512" fill="currentColor">
                      <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.2-1.6-11.1 .3-14.5 4.8s-4.2 10.7-1.5 15.8c7.4 14.4 20.2 24.8 35.8 29.2c21.9 6.2 44.8 6.2 66.6 0c15.6-4.4 28.4-14.8 35.8-29.2c2.7-5.1 1.9-11.2-1.5-15.8s-9.3-6.4-14.5-4.8c-6.4 2.1-13.2 3.3-20.3 3.3c-35.3 0-64-28.7-64-64z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={loading}
              >
                <span>{loading ? 'Signing In…' : 'Authenticate'}</span>
                <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Terminal Footer */}
          <div className={styles.cardFooter}>
            <div className={styles.footerStatus}>
              <div className={styles.statusDot}></div>
              <span className={styles.statusText}>System Operational</span>
            </div>
            <div className={styles.footerId}>
              ID: <span className={styles.footerIdValue}>8X-92</span>
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className={styles.footerLinks}>
          <p className={styles.footerText}>
            By continuing, you agree to Operators&apos;{' '}
            <a href="#" className={styles.footerLink}>
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#" className={styles.footerLink}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Decorative Abstract Elements */}
      <div className={styles.decoLeft}>
        <div className={styles.decoText}>
          <p>&gt; INITIATING SEQUENCE...</p>
          <p>&gt; LOADING ASSETS [OK]</p>
          <p>&gt; ESTABLISHING SECURE LINK...</p>
          <p className={styles.decoPulse}>&gt; WAITING FOR INPUT_</p>
        </div>
      </div>

      <div className={styles.decoRight}>
        <div className={styles.decoCircle1}></div>
        <div className={styles.decoCircle2}></div>
        <div className={styles.decoCircle3}></div>
      </div>
    </main>
  );
}

export default function InitializePage() {
  return (
    <Suspense fallback={
      <main className={styles.mainContent}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          color: '#AAAAAA'
        }}>
          Loading...
        </div>
      </main>
    }>
      <InitializeForm />
    </Suspense>
  );
}
