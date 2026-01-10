import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project 0.1 v2',
  description: 'Foundation setup',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
