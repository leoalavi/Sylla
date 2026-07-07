'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { FREE_MESSAGE_LIMIT, FREE_MESSAGE_STORAGE_KEY } from '@/lib/sylla/config';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// The anonymous counter lives in localStorage, exposed to React through a
// tiny external store so reads stay hydration-safe (server snapshot is 0).
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keep multiple open tabs in sync.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readStoredCount(): number {
  try {
    const raw = window.localStorage.getItem(FREE_MESSAGE_STORAGE_KEY);
    const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    // localStorage unavailable (private mode / blocked) — treat as fresh.
    return 0;
  }
}

function incrementStoredCount(): void {
  try {
    window.localStorage.setItem(FREE_MESSAGE_STORAGE_KEY, String(readStoredCount() + 1));
  } catch {
    // Ignore storage failures; the send itself still goes through.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Tracks the anonymous free-message allowance in localStorage and lifts the
 * limit for signed-in Supabase users.
 *
 * STANDALONE MODE ONLY: the embedded assistant inside Syllabus Sync never
 * uses this hook — its users are always signed in via the host app session.
 *
 * Phase 1 is intentionally client-side only — it is a soft preview gate, not
 * a security boundary. TODO(phase 2): enforce the limit server-side in
 * /api/sylla/chat (and log sylla_usage_events) once the Supabase session is
 * shared with Syllabus Sync.
 */
export function useAnonymousLimit() {
  const usedCount = useSyncExternalStore(subscribe, readStoredCount, () => 0);
  // `ready` flips to true only on the client, after hydration.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setIsSignedIn(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const recordMessageSent = useCallback(() => {
    if (isSignedIn) return;
    incrementStoredCount();
  }, [isSignedIn]);

  const remaining = Math.max(0, FREE_MESSAGE_LIMIT - usedCount);
  const limitReached = ready && !isSignedIn && remaining === 0;

  return { ready, isSignedIn, remaining, limitReached, recordMessageSent };
}
