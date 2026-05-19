'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { validateInviteCode } from '@/lib/invites';
import type { Invite } from '@/lib/types';
import styles from './join.module.css';

type Phase = 'code' | 'register';

function JoinFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>('code');
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState<Invite | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-validate code from URL (?code=XXXX)
  useEffect(() => {
    const fromUrl = searchParams.get('code');
    if (fromUrl && phase === 'code' && !loading) {
      setCode(fromUrl);
      handleValidate(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleValidate = async (raw?: string) => {
    setError(null);
    setLoading(true);
    const c = (raw ?? code).trim();
    if (!c) {
      setError('Enter your invite code.');
      setLoading(false);
      return;
    }
    try {
      const v = await validateInviteCode(c);
      if (!v) {
        setError('Invite code is invalid, already used, or expired.');
        setInvite(null);
        setLoading(false);
        return;
      }
      setInvite(v);
      setCode(c);
      setPhase('register');
    } catch (err) {
      setError('Could not check that invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!invite) {
      setError('Validate your invite code first.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError('Authentication is not available. Contact your admin.');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            invite_code: invite.code,
            display_name: displayName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // The trigger raises if the invite is invalid; surface that as-is.
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If email confirmation is required, Supabase returns a user with no
      // session. Tell the user to check their inbox.
      if (!data.session) {
        router.push('/initialize?error=check_email');
        return;
      }

      router.push('/today');
    } catch (err) {
      setError('Unexpected error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.bgGrid} />
      <div className={styles.radialGlow} />

      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandText}>Operators</span>
          </Link>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>{'// REDEEM INVITE'}</span>
          </h1>
          <p className={styles.subtitle}>
            Operators is invite-only. Enter the code your admin sent you to claim your seat.
          </p>
        </header>

        <section className={styles.card}>
          {error && <div className={styles.errorBox}>{error}</div>}

          {phase === 'code' && (
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                handleValidate();
              }}
            >
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Invite Code</span>
                <input
                  type="text"
                  className={styles.input}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="abc123def456"
                  autoComplete="off"
                  autoFocus
                  required
                  disabled={loading}
                />
              </label>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Checking…' : 'Continue'}
              </button>
              <p className={styles.footer}>
                Already have an account?{' '}
                <Link href="/initialize" className={styles.footerLink}>
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {phase === 'register' && invite && (
            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.inviteBadge}>
                Invite verified · code <span className={styles.inviteCode}>{invite.code}</span>
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Display Name</span>
                <input
                  type="text"
                  className={styles.input}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How your admin sees you"
                  autoComplete="name"
                  required
                  maxLength={80}
                  disabled={loading}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Password</span>
                <input
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Confirm Password</span>
                <input
                  type="password"
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </label>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Creating account…' : 'Claim Seat'}
              </button>

              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => {
                  setPhase('code');
                  setInvite(null);
                  setError(null);
                }}
                disabled={loading}
              >
                Use a different code
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <p className={styles.subtitle}>Loading…</p>
          </div>
        </main>
      }
    >
      <JoinFlow />
    </Suspense>
  );
}
