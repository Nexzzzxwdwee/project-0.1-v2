'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { clearUserIdCache } from '@/lib/storage/supabase';
import { clearStorageCache } from '@/lib/storage';
import styles from './admin-shell.module.css';

const navItems = [
  { href: '/admin', label: 'Roster' },
  { href: '/admin/invites', label: 'Invites' },
  { href: '/today', label: 'Habit Tracker' },
];

export default function AdminShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    clearUserIdCache();
    clearStorageCache();
    router.push('/initialize');
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandTag}>{'// COMMAND'}</span>
          <span className={styles.brandTitle}>Operators</span>
          <span className={styles.brandRole}>Admin</span>
        </div>
        <nav className={styles.nav}>
          <div className={styles.navSection}>MAIN</div>
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
          Sign Out
        </button>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
