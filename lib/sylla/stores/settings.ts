'use client';

import { createLocalStore, clearStores } from '@/lib/sylla/store';
import type { SyllaSettings } from '@/lib/sylla/types';

export const DEFAULT_SETTINGS: SyllaSettings = {
  theme: 'system',
  sendOnEnter: true,
  responseStyle: 'concise',
  explanationDepth: 'intermediate',
  defaultFlashcardCount: 8,
  defaultQuizCount: 5,
  mockScenario: 'normal',
};

export const settingsStore = createLocalStore<SyllaSettings>('settings', DEFAULT_SETTINGS);

export function useSettings(): SyllaSettings {
  return settingsStore.use();
}

export function updateSettings(patch: Partial<SyllaSettings>) {
  settingsStore.set((prev) => ({ ...prev, ...patch }));
}

/**
 * Settings → Data & privacy → "Clear local data".
 * Removes study content but keeps preferences (and the anonymous
 * free-message count, which is a separate product policy).
 */
export function clearLocalStudyData() {
  clearStores(['conversations', 'saved-items', 'study-plans', 'active-unit']);
}
