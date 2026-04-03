import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Check if Supabase is configured with required environment variables
 */
export function isSupabaseConfigured(): boolean {
  return env.isSupabaseConfigured();
}

// Singleton Supabase client instance for browser
let supabaseClient: SupabaseClient | undefined | null = null;

/**
 * Get Supabase browser client (singleton)
 * Returns undefined if Supabase is not configured
 * Callers must handle undefined explicitly
 *
 * Uses @supabase/ssr's createBrowserClient which stores the session
 * in cookies instead of localStorage, enabling server-side auth checks.
 */
export function getSupabaseBrowserClient(): SupabaseClient | undefined {
  if (supabaseClient !== null) {
    return supabaseClient;
  }

  if (!env.isSupabaseConfigured()) {
    supabaseClient = undefined;
    return undefined;
  }

  const url = env.public.supabaseUrl!;
  const anonKey = env.public.supabaseAnonKey!;

  supabaseClient = createBrowserClient(url, anonKey);

  return supabaseClient;
}
