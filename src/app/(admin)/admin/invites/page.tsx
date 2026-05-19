'use client';

import { useEffect, useState } from 'react';
import {
  listInvites,
  generateInvite,
  revokeInvite,
  buildInviteLink,
} from '@/lib/invites';
import type { Invite } from '@/lib/types';
import styles from './invites.module.css';

function statusLabel(invite: Invite): { text: string; tone: 'pending' | 'used' | 'expired' } {
  if (invite.isUsed) return { text: 'USED', tone: 'used' };
  if (invite.expiresAt && new Date(invite.expiresAt) <= new Date()) {
    return { text: 'EXPIRED', tone: 'expired' };
  }
  return { text: 'PENDING', tone: 'pending' };
}

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const reload = async () => {
    try {
      const list = await listInvites();
      setInvites(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load invites.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listInvites();
        if (cancelled) return;
        setInvites(list);
      } catch (err) {
        if (cancelled) return;
        setError('Failed to load invites.');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = async () => {
    setCreating(true);
    setError(null);
    try {
      await generateInvite();
      await reload();
    } catch (err) {
      console.error(err);
      setError('Failed to generate invite.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvite(id);
      await reload();
    } catch (err) {
      console.error(err);
      setError('Failed to revoke invite.');
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(buildInviteLink(code));
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1500);
    } catch {
      // ignore
    }
  };

  const pending = invites.filter((i) => !i.isUsed);
  const used = invites.filter((i) => i.isUsed);

  return (
    <div>
      <header className={styles.header}>
        <span className={styles.accent}>{'// ACCESS GRANTS'}</span>
        <h1 className={styles.title}>
          <span className={styles.titleGradient}>Invites</span>
        </h1>
        <p className={styles.subtitle}>
          Generate a code and send the link to your student. Each code can be used once.
        </p>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={handleGenerate} disabled={creating}>
          {creating ? 'Generating…' : '+ Generate Invite'}
        </button>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pending</h2>
        {loaded && pending.length === 0 && (
          <div className={styles.empty}>No pending invites.</div>
        )}
        <div className={styles.list}>
          {pending.map((invite) => {
            const status = statusLabel(invite);
            return (
              <article key={invite.id} className={styles.card}>
                <div className={styles.cardLeft}>
                  <div className={styles.codeRow}>
                    <code className={styles.code}>{invite.code}</code>
                    <span className={`${styles.statusBadge} ${styles[`status_${status.tone}`]}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Created {fmt(invite.createdAt)}</span>
                    {invite.expiresAt && <span>Expires {fmt(invite.expiresAt)}</span>}
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => handleCopy(invite.code)}
                  >
                    {copiedCode === invite.code ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={() => handleRevoke(invite.id)}
                  >
                    Revoke
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Redeemed</h2>
        {loaded && used.length === 0 && <div className={styles.empty}>No redeemed invites yet.</div>}
        <div className={styles.list}>
          {used.map((invite) => (
            <article key={invite.id} className={`${styles.card} ${styles.cardUsed}`}>
              <div className={styles.cardLeft}>
                <div className={styles.codeRow}>
                  <code className={styles.code}>{invite.code}</code>
                  <span className={`${styles.statusBadge} ${styles.status_used}`}>USED</span>
                </div>
                <div className={styles.metaRow}>
                  <span>Used {fmt(invite.usedAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
