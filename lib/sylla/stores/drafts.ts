'use client';

import { createLocalStore } from '@/lib/sylla/store';

// Composer drafts keyed by conversation id ('draft' = the unsent new-chat
// composer), so typed input survives navigation.

const draftsStore = createLocalStore<Record<string, string>>('chat-drafts', {});

export function useDraft(key: string): string {
  const drafts = draftsStore.use();
  return drafts[key] ?? '';
}

export function setDraft(key: string, text: string) {
  draftsStore.set((prev) => {
    const next = { ...prev };
    if (text) next[key] = text;
    else delete next[key];
    // Keep the map small — drafts are ephemeral.
    const keys = Object.keys(next);
    if (keys.length > 20) delete next[keys[0]];
    return next;
  });
}
