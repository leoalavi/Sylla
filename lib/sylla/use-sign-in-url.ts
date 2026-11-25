'use client';

import { useSyncExternalStore } from 'react';
import { getSignInUrl } from '@/lib/sylla/config';

// The page URL never changes without a navigation, which re-renders anyway.
const subscribeToNothing = () => () => {};

/**
 * Sign-in link that returns the user to the exact Sylla page they were on.
 *
 * Hydration-safe: the server snapshot (no page URL; returns to Sylla's home)
 * is used while hydrating so the HTML matches, then React switches to the
 * client snapshot that includes the current page.
 */
export function useSignInUrl(): string {
  return useSyncExternalStore(
    subscribeToNothing,
    () => getSignInUrl(window.location.href),
    () => getSignInUrl(),
  );
}
