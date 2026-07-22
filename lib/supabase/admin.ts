import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only service-role client. Bypasses RLS — used exclusively to call
// the sylla_* SECURITY DEFINER quota functions (see supabase/migrations/
// …_sylla_ai_usage_and_quota.sql). Never import this from client code and
// never log the key.
//
// Deliberately separate from lib/supabase/server.ts (the cookie-based user
// client): quota enforcement must work identically for anonymous requests
// that have no user session at all.

let cached: SupabaseClient | null = null;

export function isQuotaEnforcementConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !url.includes('your-project-id'));
}

/**
 * Returns the admin client, or null if Supabase/service-role isn't
 * configured (local dev without a linked Supabase project). Callers MUST
 * treat a null return as "quota enforcement unavailable" and log loudly —
 * see docs/quota-and-cost-control.md for the production requirement.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isQuotaEnforcementConfigured()) return null;
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return cached;
}
