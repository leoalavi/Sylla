'use client';

import { createLocalStore } from '@/lib/sylla/store';
import { newId, type SavedItem } from '@/lib/sylla/types';

// Saved study content (messages, summaries, flashcard sets, quizzes, plans).
// TODO(phase 2): persist to Supabase for signed-in users.

const MAX_SAVED = 100;

export const savedItemsStore = createLocalStore<SavedItem[]>('saved-items', []);

export function useSavedItems(): SavedItem[] {
  return savedItemsStore.use();
}

/** Distributes Omit across the SavedItem union (plain Omit would collapse it). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export function saveItem(item: DistributiveOmit<SavedItem, 'id' | 'createdAt'>): SavedItem {
  const saved = { ...item, id: newId(), createdAt: Date.now() } as SavedItem;
  savedItemsStore.set((prev) => [saved, ...prev].slice(0, MAX_SAVED));
  return saved;
}

export function removeSavedItem(id: string) {
  savedItemsStore.set((prev) => prev.filter((item) => item.id !== id));
}
