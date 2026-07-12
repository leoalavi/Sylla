import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStore } from '@/lib/sylla/store';
import {
  conversationsStore,
  createConversation,
  deleteConversation,
  getConversation,
  renameConversation,
  saveConversationMessages,
  titleFromMessages,
} from '@/lib/sylla/stores/conversations';
import { removeSavedItem, saveItem, savedItemsStore } from '@/lib/sylla/stores/saved-items';
import {
  clearLocalStudyData,
  DEFAULT_SETTINGS,
  settingsStore,
  updateSettings,
} from '@/lib/sylla/stores/settings';

beforeEach(() => {
  conversationsStore.clear();
  savedItemsStore.clear();
  settingsStore.clear();
});

describe('createLocalStore', () => {
  it('persists values to localStorage and reads them back', () => {
    const store = createLocalStore<number[]>('test-numbers', []);
    store.set([1, 2, 3]);
    expect(JSON.parse(window.localStorage.getItem('sylla:v1:test-numbers')!)).toEqual([1, 2, 3]);
    expect(store.get()).toEqual([1, 2, 3]);
    store.clear();
    expect(store.get()).toEqual([]);
  });

  it('falls back to the initial value on corrupt JSON', () => {
    window.localStorage.setItem('sylla:v1:test-corrupt', '{not json');
    const store = createLocalStore<{ ok: boolean }>('test-corrupt', { ok: true });
    expect(store.get()).toEqual({ ok: true });
  });

  it('supports functional updates', () => {
    const store = createLocalStore<number>('test-counter', 0);
    store.set((prev) => prev + 5);
    store.set((prev) => prev + 5);
    expect(store.get()).toBe(10);
  });
});

describe('conversations store', () => {
  it('creates conversations and derives titles from the first user message', () => {
    const conversation = createConversation(null);
    expect(getConversation(conversation.id)?.title).toBe('New conversation');

    saveConversationMessages(conversation.id, [
      { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Help me plan my exam week' }] },
      { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Sure!' }] },
    ]);
    const updated = getConversation(conversation.id);
    expect(updated?.title).toBe('Help me plan my exam week');
    expect(updated?.messages).toHaveLength(2);
  });

  it('truncates long titles', () => {
    const title = titleFromMessages([
      { id: 'm', role: 'user', parts: [{ type: 'text', text: 'a'.repeat(100) }] },
    ]);
    expect(title.length).toBeLessThanOrEqual(49);
    expect(title.endsWith('…')).toBe(true);
  });

  it('keeps a manual rename over the derived title', () => {
    const conversation = createConversation(null);
    renameConversation(conversation.id, 'My exam prep');
    saveConversationMessages(conversation.id, [
      { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'something else entirely' }] },
    ]);
    expect(getConversation(conversation.id)?.title).toBe('My exam prep');
  });

  it('deletes conversations', () => {
    const conversation = createConversation('sample-comp1000');
    deleteConversation(conversation.id);
    expect(getConversation(conversation.id)).toBeUndefined();
  });
});

describe('saved items store', () => {
  it('saves and removes items of different kinds', () => {
    const saved = saveItem({ kind: 'message', title: 'A tip', markdown: '**tip**' });
    expect(savedItemsStore.get()).toHaveLength(1);
    expect(savedItemsStore.get()[0].kind).toBe('message');
    removeSavedItem(saved.id);
    expect(savedItemsStore.get()).toHaveLength(0);
  });
});

describe('settings store', () => {
  it('merges partial updates over defaults', () => {
    expect(settingsStore.get()).toEqual(DEFAULT_SETTINGS);
    updateSettings({ theme: 'dark', defaultQuizCount: 8 });
    expect(settingsStore.get().theme).toBe('dark');
    expect(settingsStore.get().defaultQuizCount).toBe(8);
    expect(settingsStore.get().sendOnEnter).toBe(DEFAULT_SETTINGS.sendOnEnter);
  });

  it('merges partial persisted settings over defaults (schema evolution)', () => {
    // Simulate settings written by an older app version that lacked fields.
    window.localStorage.setItem('sylla:v1:settings', JSON.stringify({ mockScenario: 'error' }));
    const unsubscribe = settingsStore.subscribe(() => {}); // live listener re-reads on storage events
    window.dispatchEvent(new StorageEvent('storage', { key: 'sylla:v1:settings' }));
    const value = settingsStore.get();
    unsubscribe();
    expect(value.mockScenario).toBe('error');
    expect(value.defaultFlashcardCount).toBe(DEFAULT_SETTINGS.defaultFlashcardCount);
    expect(value.sendOnEnter).toBe(DEFAULT_SETTINGS.sendOnEnter);
  });

  it('clearLocalStudyData wipes study content but keeps preferences', () => {
    updateSettings({ theme: 'dark' });
    createConversation(null);
    saveItem({ kind: 'message', title: 't', markdown: 'm' });
    clearLocalStudyData();
    expect(conversationsStore.get()).toHaveLength(0);
    expect(savedItemsStore.get()).toHaveLength(0);
    expect(settingsStore.get().theme).toBe('dark');
  });
});
