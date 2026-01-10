/**
 * Environment variable configuration
 * All Supabase variables are OPTIONAL in Phase 1
 */
export const env = {
  public: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  isSupabaseConfigured: (): boolean => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key && url.length > 0 && key.length > 0);
  },
} as const;
