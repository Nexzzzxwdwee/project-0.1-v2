import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Check if Supabase is configured with required environment variables
 */
export function isSupabaseConfigured(): boolean {
  return env.isSupabaseConfigured();
}

/**
 * Get Supabase server client
 * Uses the same anon key for now (no service role in Phase 1)
 * Returns undefined if Supabase is not configured
 * Callers must handle undefined explicitly
 */
export function getSupabaseServerClient(): SupabaseClient | undefined {
  if (!env.isSupabaseConfigured()) {
    return undefined;
  }

  const url = env.public.supabaseUrl!;
  const anonKey = env.public.supabaseAnonKey!;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}
