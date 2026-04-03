import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Check if Supabase is configured with required environment variables
 */
export function isSupabaseConfigured(): boolean {
  return env.isSupabaseConfigured();
}

/**
 * Get Supabase server client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes auth session via cookies.
 *
 * Returns undefined if Supabase is not configured.
 */
export function getSupabaseServerClient() {
  if (!env.isSupabaseConfigured()) {
    return undefined;
  }

  const url = env.public.supabaseUrl!;
  const anonKey = env.public.supabaseAnonKey!;
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // set() fails in Server Components (read-only context) — safe to ignore
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // same as above
        }
      },
    },
  });
}
