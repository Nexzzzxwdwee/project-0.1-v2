import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseStatus = isSupabaseConfigured() ? 'configured' : 'missing';

  return NextResponse.json(
    {
      status: 'ok',
      supabase: supabaseStatus,
    },
    { status: 200 }
  );
}
