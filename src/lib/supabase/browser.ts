import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Check if Supabase is configured with required environment variables
 */
export function isSupabaseConfigured(): boolean {
  return env.isSupabaseConfigured();
}

/**
 * Get Supabase browser client
 * Returns undefined if Supabase is not configured
 * Callers must handle undefined explicitly
 */
export function getSupabaseBrowserClient(): SupabaseClient | undefined {
  if (!env.isSupabaseConfigured()) {
    return undefined;
  }

  const url = env.public.supabaseUrl!;
  const anonKey = env.public.supabaseAnonKey!;

  return createClient(url, anonKey);
}
