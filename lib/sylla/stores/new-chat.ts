'use client';

import { useSyncExternalStore } from 'react';

// In-memory nonce bumped by every "New chat" click so the /chat route can
// remount a fresh composer even when it is already the active route.

let nonce = 0;
const listeners = new Set<() => void>();

export function bumpNewChat() {
  nonce += 1;
  listeners.forEach((listener) => listener());
}

export function useNewChatNonce(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => nonce,
    () => 0,
  );
}
