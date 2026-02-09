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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userExistsError, setUserExistsError] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Check for error and tab in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    } else if (errorParam === 'supabase_not_configured') {
      setError('Authentication service is not available. Please contact support.');
    }

    // Set initial tab from query param
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup') {
      setActiveTab('signup');
    } else if (tabParam === 'signin') {
      setActiveTab('signin');
    }
  }, [searchParams]);

  // Clear user exists error when switching tabs
  useEffect(() => {
    setUserExistsError(false);
  }, [activeTab]);

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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Success - redirect to today
      router.push('/today');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
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
        // Check if error indicates user already exists
        const errorMessage = signUpError.message.toLowerCase();
        const isUserExists = 
          errorMessage.includes('user already registered') ||
          errorMessage.includes('already registered') ||
          errorMessage.includes('email already exists') ||
          errorMessage.includes('user already exists') ||
          signUpError.status === 422; // Common status for validation errors including existing user
        
        if (isUserExists) {
          setUserExistsError(true);
          setError(null);
          // Switch to signin tab
          setActiveTab('signin');
        } else {
          setError(signUpError.message);
          setUserExistsError(false);
        }
        setLoading(false);
        return;
      }

      // Success - redirect to onboarding
      router.push('/onboarding');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = activeTab === 'signin' ? handleSignIn : handleSignUp;

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
            <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
              <path d="M326.612 185.391c59.747 59.809 58.927 155.698.36 214.59-.11.12-.24.25-.36.37l-67.2 67.2c-59.27 59.27-155.699 59.262-214.96 0-59.27-59.26-59.27-155.7 0-214.96l37.106-37.106c9.84-9.84 26.786-3.3 27.294 10.606.648 17.722 3.826 35.527 9.69 52.721 1.986 5.822.567 12.262-3.783 16.612l-13.087 13.087c-28.026 28.026-28.905 73.66-1.155 101.96 28.024 28.579 74.086 28.749 102.325.51l67.2-67.19c28.191-28.191 28.073-73.757 0-101.83-3.701-3.694-7.429-6.564-10.341-8.569a16.037 16.037 0 0 1-6.947-12.606c-.396-10.567 3.348-21.456 11.698-29.806l21.054-21.055c5.521-5.521 14.182-6.199 20.584-1.731a152.482 152.482 0 0 1 20.522 17.197zM467.547 44.449c-59.261-59.262-155.69-59.27-214.96 0l-67.2 67.2c-.12.12-.25.25-.37.36-58.566 58.892-59.387 154.781.36 214.59a152.454 152.454 0 0 0 20.521 17.196c6.402 4.468 15.064 3.789 20.584-1.731l21.054-21.055c8.35-8.35 12.094-19.239 11.698-29.806a16.037 16.037 0 0 0-6.947-12.606c-2.912-2.005-6.64-4.875-10.341-8.569-28.073-28.073-28.191-73.639 0-101.83l67.2-67.19c28.239-28.239 74.3-28.069 102.325.51 27.75 28.3 26.872 73.934-1.155 101.96l-13.087 13.087c-4.35 4.35-5.769 10.79-3.783 16.612 5.864 17.194 9.042 34.999 9.69 52.721.509 13.906 17.454 20.446 27.294 10.606l37.106-37.106c59.271-59.259 59.271-155.699.001-214.959z" />
            </svg>
          </Link>
          <h1 className={styles.brandTitle}>Project 0.1</h1>
          <p className={styles.brandSubtitle}>v0.1.4-beta // System Access</p>
        </div>

        {/* Auth Card */}
        <div className={styles.cardAuthMain}>
          <div className={styles.accentLine}></div>

          {/* Tabs */}
          <div className={styles.sectionTabs}>
            <button 
              type="button"
              className={`${styles.tab} ${activeTab === 'signin' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('signin');
                setError(null);
                setUserExistsError(false);
              }}
            >
              Sign In
            </button>
            <button 
              type="button"
              className={`${styles.tab} ${activeTab === 'signup' ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setUserExistsError(false);
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className={styles.formContent}>
            <form className={styles.formLogin} onSubmit={handleSubmit}>
              {/* User Exists Error Message */}
              {userExistsError && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  color: '#ef4444',
                  fontSize: '0.875rem'
                }}>
                  Account already exists — please sign in
                </div>
              )}

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
                  {activeTab === 'signin' && (
                    <a href="#" className={styles.forgotLink}>
                      Forgot?
                    </a>
                  )}
                </div>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIconLeft}>
                    <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                      <path d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={styles.textInput}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={styles.inputIconRightButton}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <svg className={styles.icon} viewBox="0 0 640 512" fill="currentColor">
                        <path d="M634 471L38 3.7C28.7-3.2 15.4-1.2 8.6 8.2S-1.2 30.8 8.2 37.6l78.2 61.2C33.8 141.6 2.5 196.1 1.4 198.1c-1.9 3.5-1.9 7.8 0 11.3C19.2 244 79.7 352 192 409.4c94.5 48 186.2 32.8 258.6-10.6l120.8 94.6c9.4 7.3 22.8 5.6 30.1-3.8s5.6-22.8-3.8-30.1zM320 160c28.2 0 54.1 10.2 74 27.2l-36.9 28.9c-10-6.2-21.8-9.8-34.1-9.8c-35.3 0-64 28.7-64 64c0 7.9 1.4 15.5 4 22.5l-38.1 29.8c-7.3-15-11.4-31.8-11.4-49.8c0-61.9 50.1-112 112-112zm0 272c-119.2 0-195.7-94.7-223.4-144c15.3-26.4 55.7-82.2 120.8-114.7l48.6 38c-24.5 18.7-40.3 48.1-40.3 81.1c0 56.5 45.7 102.2 102.2 102.2c20 0 38.7-5.7 54.5-15.5l49.7 38.9c-31.8 12.5-67.2 14.8-112.1 14.8zm318.6-226.7C620.8 180 560.3 72 448 14.6c-71.6-36.5-142.8-36.5-205.9-15.3l61.1 47.9c45.5-7.7 92.1 2.4 136.9 30.9c65.1 32.5 105.5 88.4 120.8 114.7c-8.2 14.5-27.2 44.3-58.5 72.1l45.2 35.4c40.8-35.8 63.8-71.9 71-84.5c1.9-3.5 1.9-7.8 0-11.3z" />
                      </svg>
                    ) : (
                      <svg className={styles.icon} viewBox="0 0 576 512" fill="currentColor">
                        <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.2-1.6-11.1 .3-14.5 4.8s-4.2 10.7-1.5 15.8c7.4 14.4 20.2 24.8 35.8 29.2c21.9 6.2 44.8 6.2 66.6 0c15.6-4.4 28.4-14.8 35.8-29.2c2.7-5.1 1.9-11.2-1.5-15.8s-9.3-6.4-14.5-4.8c-6.4 2.1-13.2 3.3-20.3 3.3c-35.3 0-64-28.7-64-64z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={loading}
              >
                <span>{loading ? (activeTab === 'signin' ? 'Signing In...' : 'Creating Account...') : (activeTab === 'signin' ? 'Authenticate' : 'Sign Up')}</span>
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
            By continuing, you agree to Project 0.1&apos;s{' '}
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
          color: '#a8a29e'
        }}>
          Loading...
        </div>
      </main>
    }>
      <InitializeForm />
    </Suspense>
  );
}
