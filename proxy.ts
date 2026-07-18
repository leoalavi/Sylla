// Next.js 16 proxy (formerly middleware) — same convention as Syllabus Sync.
//
// Refreshes the shared Supabase session cookie on navigation so a login from
// Syllabus Sync (same Supabase project) stays valid while using Sylla, and
// server components always see a fresh session. No routes are auth-GATED
// here: Sylla is usable anonymously by design (preview limit is a UX gate).
//
// Skips silently when Supabase env vars are absent (local demo mode).

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthCookieOptions } from '@/lib/supabase/cookie-options';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching auth state refreshes an expired session cookie if needed.
  // Never throws on missing sessions; anonymous visitors pass straight through.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip static assets and Next internals; API routes handle their own auth.
  matcher: ['/((?!_next/|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|json)$).*)'],
};
