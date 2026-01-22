'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getActivePresetId } from '@/lib/presets';
import { clearUserIdCache } from '@/lib/storage/supabase';
import type { User } from '@supabase/supabase-js';
import styles from './app-shell.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
        // If Supabase not configured, allow access (fallback mode)
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
        return;
      }

      try {
        // Resolve session ONCE (prevents AbortError from concurrent calls)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] Session check completed', { hasSession: !!session });
        }

        setUser(session?.user ?? null);
        setAuthChecked(true);

        // Get current pathname (may differ from pathname state due to navigation)
        const currentPath = window.location.pathname;

        // Only redirect AFTER auth check completes
        if (!session) {
          if (currentPath !== '/initialize' && currentPath !== '/signup') {
            router.push('/initialize');
          }
          setLoading(false);
          return;
        }

        // If authenticated but no activePresetId, redirect to onboarding
        // Skip this check if already on onboarding page to prevent redirect loop
        if (session && currentPath !== '/onboarding') {
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
            console.error('[Auth] Failed to check session:', error);
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
  }, []); // Empty deps - run once on mount

  // Listen for auth changes (register listener once)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !authChecked) return; // Wait for initial check

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      clearUserIdCache();

      // Only redirect if auth was already checked (prevents race conditions)
      // Get current pathname inside callback to avoid stale closure
      const currentPath = window.location.pathname;
      
      if (!session) {
        if (currentPath !== '/initialize' && currentPath !== '/signup') {
          router.push('/initialize');
        }
      } else if (session && currentPath !== '/onboarding') {
        // Check if user needs onboarding (async)
        try {
          const activePresetId = await getActivePresetId();
          if (!activePresetId && currentPath !== '/onboarding') {
            router.push('/onboarding');
          }
        } catch (error) {
          // Silently handle error - don't redirect on error
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
  }, [authChecked, router]); // Only re-register if authChecked changes (once)

  const navItems = [
    { href: '/today', label: 'Today', icon: 'calendar-day' },
    { href: '/history', label: 'History', icon: 'clock-rotate-left' },
    { href: '/weekly', label: 'Weekly', icon: 'calendar-week' },
    { href: '/journal', label: 'Journal', icon: 'book' },
    { href: '/goals', label: 'Goals', icon: 'bullseye' },
    { href: '/earnings', label: 'Earnings', icon: 'coins' },
    { href: '/rank', label: 'Rank', icon: 'medal' },
    { href: '/habits', label: 'Habits', icon: 'heart' },
  ];

  const getIconSVG = (iconName: string) => {
    const icons: Record<string, string> = {
      'calendar-day': 'M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm80 64c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16h96c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80z',
      'clock-rotate-left': 'M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24H134.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24V256c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z',
      'calendar-week': 'M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm80 64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16H368c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80z',
      'book': 'M96 0C43 0 0 43 0 96V416c0 53 43 96 96 96H384h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V384c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32H384 96zm0 384H352v64H96c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16H336c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16zm16 48H336c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16s7.2-16 16-16z',
      'bullseye': 'M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z',
      'coins': 'M512 80c0 18-14.3 34.6-38.4 48c-29.1 16.1-72.5 27.5-122.3 30.9c-3.7-1.8-7.4-3.5-11.3-5C300.6 137.4 248.2 128 192 128c-8.3 0-16.4 .2-24.5 .6l-1.1-.6C142.3 114.6 128 98 128 80c0-44.2 86-80 192-80S512 35.8 512 80zM160.7 161.1c10.2-.7 20.7-1.1 31.3-1.1c62.2 0 117.4 12.3 152.5 31.4C369.3 204.9 384 221.7 384 240c0 4-.7 7.9-2.1 11.7c-4.6 13.2-17 25.3-35 35.5c0 0 0 0 0 0c-.1 .1-.3 .1-.4 .2l0 0 0 0c-.3 .2-.6 .3-.9 .5c-35 19.4-90.8 32-153.6 32c-59.6 0-112.9-11.3-148.2-29.1c-1.9-.9-3.7-1.9-5.5-2.9C14.3 274.6 0 258 0 240c0-34.8 53.4-64.5 128-75.4c10.5-1.5 21.4-2.7 32.7-3.5zM416 240c0-21.9-10.6-39.9-24.1-53.4c28.3-4.4 54.2-11.4 76.2-20.5c16.3-6.8 31.5-15.2 43.9-25.5V176c0 19.3-16.5 37.1-43.8 50.9c-14.6 7.4-32.4 13.7-52.4 18.5c.1-1.8 .2-3.5 .2-5.3zm-32 96c0 18-14.3 34.6-38.4 48c-1.8 1-3.6 1.9-5.5 2.9C304.9 404.7 251.6 416 192 416c-62.8 0-118.6-12.6-153.6-32C14.3 370.6 0 354 0 336V300.6c12.5 10.3 27.6 18.7 43.9 25.5C83.4 342.6 135.8 352 192 352s108.6-9.4 148.1-25.9c7.8-3.2 15.3-6.9 22.4-10.9c6.1-3.4 11.8-7.2 17.2-11.2c1.5-1.1 2.9-2.3 4.3-3.4V304v5.7V336zm32 0V304 278.1c19-4.2 36.5-9.5 52.1-16c16.3-6.8 31.5-15.2 43.9-25.5V272c0 10.5-5 21-14.9 30.9c-16.3 16.3-45 29.7-81.3 38.4c.1-1.7 .2-3.5 .2-5.3zM192 448c56.2 0 108.6-9.4 148.1-25.9c16.3-6.8 31.5-15.2 43.9-25.5V432c0 44.2-86 80-192 80S0 476.2 0 432V396.6c12.5 10.3 27.6 18.7 43.9 25.5C83.4 438.6 135.8 448 192 448z',
      'medal': 'M4.1 38.2C1.4 34.2 0 29.4 0 24.6C0 11 11 0 24.6 0H133.9c11.2 0 21.7 5.9 27.4 15.5l68.5 114.1c-48.2 6.1-91.3 28.6-123.4 61.9L4.1 38.2zm503.7 0L405.6 191.5c-32.1-33.3-75.2-55.8-123.4-61.9L350.7 15.5C356.5 5.9 366.9 0 378.1 0H487.4C501 0 512 11 512 24.6c0 4.8-1.4 9.6-4.1 13.6zM80 336a176 176 0 1 1 352 0A176 176 0 1 1 80 336zm184.4-94.9c-3.4-7-13.3-7-16.8 0l-22.4 45.4c-1.4 2.8-4 4.7-7 5.1L168 298.9c-7.7 1.1-10.7 10.5-5.2 16l36.3 35.4c2.2 2.2 3.2 5.2 2.7 8.3l-8.6 49.9c-1.3 7.6 6.7 13.5 13.6 9.9l44.8-23.6c2.7-1.4 6-1.4 8.7 0l44.8 23.6c6.9 3.6 14.9-2.2 13.6-9.9l-8.6-49.9c-.5-3 .5-6.1 2.7-8.3l36.3-35.4c5.6-5.4 2.5-14.8-5.2-16l-50.1-7.3c-3-.4-5.7-2.4-7-5.1l-22.4-45.4z',
      'heart': 'M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z',
      'gear': 'M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z',
    };
    return icons[iconName] || '';
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  useEffect(() => {
    closeDrawer();
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

  const renderNavItems = () => (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={closeDrawer}
          >
            <svg className={styles.navIcon} viewBox="0 0 512 512" fill="currentColor">
              <path d={getIconSVG(item.icon)} />
            </svg>
            <span className={styles.navLabel}>{item.label}</span>
            {isActive && <div className={styles.navActiveDot}></div>}
          </Link>
        );
      })}
    </>
  );

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          color: '#a8a29e'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      {/* Mobile Top Bar */}
      <div className={styles.mobileTopBar}>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
            <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
          </svg>
        </button>
        <span className={styles.mobileTitle}>Project 0.1</span>
      </div>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={closeDrawer} aria-hidden="true"></div>
      )}

      {/* Mobile Drawer */}
      <aside className={`${styles.mobileDrawer} ${isDrawerOpen ? styles.mobileDrawerOpen : ''}`}>
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
            <svg className={styles.icon} viewBox="0 0 384 512" fill="currentColor">
              <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {renderNavItems()}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link
            href="/settings"
            className={`${styles.navItem} ${pathname === '/settings' ? styles.navItemActive : ''}`}
            onClick={closeDrawer}
          >
            <svg className={styles.navIcon} viewBox="0 0 512 512" fill="currentColor">
              <path d={getIconSVG('gear')} />
            </svg>
            <span className={styles.navLabel}>Settings</span>
            {pathname === '/settings' && <div className={styles.navActiveDot}></div>}
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

          <nav className={styles.nav}>
            {renderNavItems()}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <Link href="/settings" className={`${styles.navItem} ${pathname === '/settings' ? styles.navItemActive : ''}`}>
            <svg className={styles.navIcon} viewBox="0 0 512 512" fill="currentColor">
              <path d={getIconSVG('gear')} />
            </svg>
            <span className={styles.navLabel}>Settings</span>
            {pathname === '/settings' && <div className={styles.navActiveDot}></div>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Background Grid Effect */}
        <div className={styles.bgGrid}></div>
        <div className={styles.contentInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
