import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client, mirroring the Syllabus Sync pattern.
//
// Not used by the Phase 1 chat flow yet — it exists so future phases can:
//   - resolve the signed-in user inside /api/sylla/chat (server-enforced limits)
//   - persist conversations to sylla_conversations / sylla_messages tables
//   - run RAG queries over user-owned documents behind RLS
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
