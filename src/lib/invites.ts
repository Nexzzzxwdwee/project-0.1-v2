/**
 * Invite service — public validation + admin management.
 * Admin operations gated by RLS (require is_admin()).
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Invite } from '@/lib/types';

function rowToInvite(row: Record<string, unknown>): Invite {
  return {
    id: row.id as string,
    code: row.code as string,
    createdBy: (row.created_by as string | null) ?? null,
    usedBy: (row.used_by as string | null) ?? null,
    usedAt: (row.used_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    isUsed: row.is_used as boolean,
    createdAt: row.created_at as string,
  };
}

/**
 * Validate an invite code. Returns the invite row if usable (unused and not
 * expired); returns null otherwise. Available to anonymous + authenticated
 * users via the "invites public read unused" RLS policy.
 */
export async function validateInviteCode(code: string): Promise<Invite | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('code', trimmed)
    .eq('is_used', false)
    .maybeSingle();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at as string) <= new Date()) return null;
  return rowToInvite(data);
}

// ── Admin operations ──

export async function listInvites(): Promise<Invite[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToInvite);
}

export async function generateInvite(expiresAt?: Date | null): Promise<Invite> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const payload: Record<string, unknown> = { created_by: user.id };
  if (expiresAt) payload.expires_at = expiresAt.toISOString();

  const { data, error } = await supabase
    .from('invites')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return rowToInvite(data);
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase not configured');
  // Hard-delete unused invites; admin policy permits delete.
  const { error } = await supabase
    .from('invites')
    .delete()
    .eq('id', inviteId)
    .eq('is_used', false);
  if (error) throw error;
}

export function buildInviteLink(code: string): string {
  if (typeof window === 'undefined') return `/join?code=${encodeURIComponent(code)}`;
  return `${window.location.origin}/join?code=${encodeURIComponent(code)}`;
}
