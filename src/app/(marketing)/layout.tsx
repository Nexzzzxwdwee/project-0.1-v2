import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'Build tactical habits, track your rank, and seal every day. Join Project 0.1.',
};

const space = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${space.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}

