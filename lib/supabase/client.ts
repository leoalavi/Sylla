'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthCookieOptions } from '@/lib/supabase/cookie-options';

// Sylla shares the Syllabus Sync Supabase project: identical env var names so
// one set of credentials can be copied between the two apps.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      !supabaseUrl.includes('your-project-id') &&
      supabaseAnonKey &&
      (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_')),
  );
}

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client. Returns null when env vars are absent so the chat
 * UI can still run in demo mode (everyone is treated as anonymous).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookieOptions: getAuthCookieOptions(),
    });
  }
  return client;
}
