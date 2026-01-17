import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.redirect(new URL('/initialize?error=supabase_not_configured', requestUrl.origin));
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL('/initialize?error=auth_failed', requestUrl.origin));
    }

    // Success - redirect to onboarding for new users, or today for existing
    return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
  }

  // No code provided, redirect to initialize
  return NextResponse.redirect(new URL('/initialize', requestUrl.origin));
}

