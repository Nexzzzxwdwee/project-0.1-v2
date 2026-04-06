import AppShellClient from './AppShellClient';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="green">
      <AppShellClient>{children}</AppShellClient>
    </div>
  );
}
