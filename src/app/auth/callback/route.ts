import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env } from '@/lib/env';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/initialize', requestUrl.origin));
  }

  if (!env.isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/initialize?error=supabase_not_configured', requestUrl.origin));
  }

  // Build the redirect response first so we can attach Set-Cookie headers to it
  const response = NextResponse.redirect(new URL('/onboarding', requestUrl.origin));

  const supabase = createServerClient(
    env.public.supabaseUrl!,
    env.public.supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')
            ?.split('; ')
            .find((c) => c.startsWith(`${name}=`))
            ?.split('=')
            .slice(1)
            .join('=');
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/initialize?error=auth_failed', requestUrl.origin));
  }

  return response;
}
