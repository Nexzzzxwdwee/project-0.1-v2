import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import AdminShellClient from './admin-shell-client';

/**
 * Server-side admin role gate. Middleware also enforces this, but we
 * recheck here so direct rendering can never leak admin UI to a non-admin
 * (defence in depth: route, middleware, RLS).
 */
async function assertAdmin(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // No Supabase configured — there is no admin to gate to.
    redirect('/today');
  }

  const cookieStore = cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(_name: string, _value: string, _options: CookieOptions) {
        // no-op: layout cannot mutate cookies
      },
      remove(_name: string, _options: CookieOptions) {
        // no-op
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/initialize');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin' || !profile.is_active) {
    redirect('/today');
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertAdmin();
  return <AdminShellClient>{children}</AdminShellClient>;
}
