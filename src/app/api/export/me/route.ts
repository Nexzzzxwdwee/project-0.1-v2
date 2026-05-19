import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { fetchExportForUser, exportFilenameSlug } from '@/lib/export/server';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await fetchExportForUser(user.id, supabase);
  const slug = exportFilenameSlug(payload.profile.displayName, user.id);
  return NextResponse.json({ payload, slug });
}
