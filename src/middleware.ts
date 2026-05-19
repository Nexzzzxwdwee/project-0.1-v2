import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, allow through (localStorage-only mode)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Create a response we can mutate (to refresh session cookies if needed)
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL('/initialize', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Role gate: /admin/* is admin-only.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || profile.role !== 'admin' || !profile.is_active) {
      return NextResponse.redirect(new URL('/today', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/today/:path*',
    '/focus/:path*',
    '/history/:path*',
    '/weekly/:path*',
    '/journal/:path*',
    '/goals/:path*',
    '/earnings/:path*',
    '/rank/:path*',
    '/habits/:path*',
    '/settings/:path*',
    '/feedback/:path*',
    '/day/:path*',
    '/trading/:path*',
    '/admin/:path*',
  ],
};
