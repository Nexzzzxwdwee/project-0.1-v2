import { SidebarNav } from './SidebarNav';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
      </div>
    </div>
  );
}

