import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';

  return NextResponse.json(
    {
      status: 'ok',
      ...(isProduction ? {} : { supabase: isSupabaseConfigured() ? 'configured' : 'missing' }),
    },
    { status: 200 }
  );
}
