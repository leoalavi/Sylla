'use client';

import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { scopeForUser, setStorageScope } from '@/lib/sylla/store';

/**
 * Points Sylla's private browser storage (chat history, drafts, saved items,
 * study plans) at the signed-in account, or at the anonymous bucket when
 * signed out. Signing out, or switching to another account, therefore never
 * shows the previous person's history on a shared browser.
 *
 * Renders nothing. Mounted once by AppShell, for both the standalone app and
 * the panel embedded in Syllabus Sync.
 */
export function StorageScopeSync() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // Supabase not configured (local demo mode): nobody can sign in.
      setStorageScope(scopeForUser(null));
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setStorageScope(scopeForUser(data.session?.user.id));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStorageScope(scopeForUser(session?.user.id));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
