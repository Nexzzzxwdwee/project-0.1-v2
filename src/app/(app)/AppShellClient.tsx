'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getActivePresetId } from '@/lib/presets';
import type { User } from '@supabase/supabase-js';
import { iconPaths } from '@/components/ui/icons';
import styles from './app-shell.module.css';

const navItems = [
  { href: '/today', label: 'Today', icon: 'calendar-day' },
  { href: '/history', label: 'History', icon: 'clock-rotate-left' },
  { href: '/weekly', label: 'Weekly', icon: 'calendar-week' },
  { href: '/journal', label: 'Journal', icon: 'book' },
  { href: '/goals', label: 'Goals', icon: 'bullseye' },
  { href: '/earnings', label: 'Earnings', icon: 'coins' },
  { href: '/rank', label: 'Rank', icon: 'medal' },
  { href: '/habits', label: 'Habits', icon: 'heart' },
  { href: '/trading', label: 'Trading', icon: 'chart-line' },
];

function getIconSVG(iconName: string) {
  return iconPaths[iconName] || '';
}

export default function AppShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth status on mount (run once)
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const {
          data: { user: validatedUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setUser(validatedUser);
        setAuthChecked(true);

        const currentPath = window.location.pathname;

        if (!validatedUser) {
          if (currentPath !== '/initialize' && currentPath !== '/signup') {
            router.push('/initialize');
          }
          setLoading(false);
          return;
        }

        if (currentPath !== '/onboarding') {
          const activePresetId = await getActivePresetId();
          if (!activePresetId && currentPath !== '/onboarding') {
            router.push('/onboarding');
            setLoading(false);
            return;
          }
        }

        setLoading(false);
      } catch (error) {
        if (mounted) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Auth] Failed to validate user:', error);
          }
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for auth changes (register listener once)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !authChecked) return;

    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);

      const currentPath = window.location.pathname;

      if (!session) {
        if (currentPath !== '/initialize' && currentPath !== '/signup') {
          router.push('/initialize');
        }
      } else if (session && currentPath !== '/onboarding') {
        try {
          const activePresetId = await getActivePresetId();
          if (!activePresetId && currentPath !== '/onboarding') {
            router.push('/onboarding');
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Auth] Failed to check activePresetId:', error);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authChecked, router]);

  const closeDrawer = () => setIsDrawerOpen(false);

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    closeDrawer();
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 768;
    if (isMobile && isDrawerOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isDrawerOpen]);

  const renderNavItems = (opts?: { onItemClick?: () => void }) => (
    <>
      <div className={styles.sectionLabel}>MAIN</div>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === '/trading' && pathname.startsWith('/trading/'));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={opts?.onItemClick}
          >
            <svg
              className={styles.navIcon}
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d={getIconSVG(item.icon)} />
            </svg>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            color: 'var(--text-secondary)',
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  const theme = pathname.startsWith('/trading') ? 'blue' : 'green';

  return (
    <div className={styles.mainContainer} data-theme={theme}>
      {/* Mobile Top Bar */}
      <div className={styles.mobileTopBar}>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg
            className={styles.icon}
            viewBox="0 0 448 512"
            fill="currentColor"
          >
            <path d={getIconSVG('menu')} />
          </svg>
        </button>
        <span className={styles.mobileTitle}>Project 0.1</span>
      </div>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className={styles.drawerOverlay}
          onClick={closeDrawer}
          aria-hidden="true"
        ></div>
      )}

      {/* Mobile Drawer */}
      <aside
        className={`${styles.mobileDrawer} ${isDrawerOpen ? styles.mobileDrawerOpen : ''}`}
      >
        <div className={styles.mobileDrawerHeader}>
          <div className={styles.mobileDrawerBrand}>
            <div className={styles.brandIcon}>
              <span className={styles.brandText}>0.1</span>
            </div>
            <span className={styles.brandLabel}>Project 0.1</span>
          </div>
          <button
            type="button"
            className={styles.mobileDrawerClose}
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          >
            <svg
              className={styles.icon}
              viewBox="0 0 384 512"
              fill="currentColor"
            >
              <path d={getIconSVG('xmark')} />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>{renderNavItems({ onItemClick: closeDrawer })}</nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sectionLabel}>SYSTEM</div>
          <Link
            href="/settings"
            className={`${styles.navItem} ${pathname === '/settings' ? styles.navItemActive : ''}`}
            onClick={closeDrawer}
          >
            <svg
              className={styles.navIcon}
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d={getIconSVG('gear')} />
            </svg>
            <span className={styles.navLabel}>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Desktop Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.sidebarBrand}>
            <div className={styles.brandIcon}>
              <span className={styles.brandText}>0.1</span>
            </div>
            <span className={styles.brandLabel}>Project 0.1</span>
          </div>

          <nav className={styles.nav}>{renderNavItems()}</nav>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.sectionLabel}>SYSTEM</div>
          <Link
            href="/settings"
            className={`${styles.navItem} ${pathname === '/settings' ? styles.navItemActive : ''}`}
          >
            <svg
              className={styles.navIcon}
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d={getIconSVG('gear')} />
            </svg>
            <span className={styles.navLabel}>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className={styles.mainContent}>
        <div key={pathname} className={styles.contentInner}>{children}</div>
      </main>
    </div>
  );
}
