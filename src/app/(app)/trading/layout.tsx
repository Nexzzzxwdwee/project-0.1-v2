'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './trading-layout.module.css';

const subNavItems = [
  { href: '/trading/dashboard', label: 'Dashboard' },
  { href: '/trading/accounts', label: 'Accounts' },
  { href: '/trading/journal', label: 'Journal' },
  { href: '/trading/reports', label: 'Reports' },
];

export default function TradingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.container}>
      <nav className={styles.subNav}>
        {subNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.subNavItem} ${isActive ? styles.subNavItemActive : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
