'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface SessionState {
  /** false until the initial session check settles (or instantly when Supabase is unconfigured). */
  ready: boolean;
  isSignedIn: boolean;
  email: string | null;
}

/**
 * Shared Supabase session state (same project/user base as Syllabus Sync).
 * Handles the unconfigured-env case by resolving to signed-out demo mode.
 */
export function useSupabaseSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    ready: !isSupabaseConfigured(),
    isSignedIn: false,
    email: null,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState({
        ready: true,
        isSignedIn: Boolean(data.session),
        email: data.session?.user.email ?? null,
      });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ ready: true, isSignedIn: Boolean(session), email: session?.user.email ?? null });
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
