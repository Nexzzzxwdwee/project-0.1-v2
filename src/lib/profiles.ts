/**
 * Profile service — role/identity for the signed-in user.
 * Reads `public.profiles` via Supabase. All access is RLS-gated.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Profile, UserRole } from '@/lib/types';

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    role: row.role as UserRole,
    invitedBy: (row.invited_by as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    isActive: row.is_active as boolean,
    lastActiveAt: (row.last_active_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data);
}

export async function touchLastActive(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', user.id);
}

export async function updateMyDisplayName(displayName: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id);
  if (error) throw error;
}
