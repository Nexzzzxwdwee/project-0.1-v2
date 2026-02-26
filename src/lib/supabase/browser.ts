import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
 * IMPORTANT: This creates ONE client instance that is reused across the app.
 * This prevents multiple auth listeners and lock conflicts.
 */
export function getSupabaseBrowserClient(): SupabaseClient | undefined {
  // Return cached client if already created
  if (supabaseClient !== null) {
    return supabaseClient;
  }

  if (!env.isSupabaseConfigured()) {
    supabaseClient = undefined;
    return undefined;
  }

  const url = env.public.supabaseUrl!;
  const anonKey = env.public.supabaseAnonKey!;

  supabaseClient = createClient(url, anonKey);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Supabase] Browser client initialized (singleton)');
  }

  return supabaseClient;
}

/**
 * Subscribe to auth readiness (fires when a user session exists).
 * Returns an unsubscribe function.
 */
export function onAuthReady(callback: () => void): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
