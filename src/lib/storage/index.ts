/**
 * Storage adapter factory
 * Returns the appropriate adapter based on feature flag
 */

import { isSupabaseConfigured } from '@/lib/supabase/browser';
import { localStorageAdapter } from './local';
import { supabaseAdapter } from './supabase';
import type { StorageAdapter } from './types';

let cachedAdapter: StorageAdapter | null = null;

/**
 * Get the storage adapter instance
 * Caches the adapter after first creation
 */
export function getStorage(): StorageAdapter {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE_STORAGE === 'true';
  const supabaseConfigured = isSupabaseConfigured();

  if (useSupabase && supabaseConfigured) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Storage] Using Supabase adapter');
    }
    cachedAdapter = supabaseAdapter();
  } else {
    if (process.env.NODE_ENV === 'development') {
      if (useSupabase && !supabaseConfigured) {
        console.warn('[Storage] Supabase flag enabled but not configured, falling back to localStorage');
      } else {
        console.log('[Storage] Using localStorage adapter');
      }
    }
    cachedAdapter = localStorageAdapter();
  }

  return cachedAdapter;
}

/**
 * Clear the cached adapter (useful for testing)
 */
export function clearStorageCache(): void {
  cachedAdapter = null;
}


