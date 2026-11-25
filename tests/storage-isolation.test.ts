import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { scopeForUser, setStorageScope } from '@/lib/sylla/store';
import {
  conversationsStore,
  createConversation,
  getConversation,
  saveConversationMessages,
} from '@/lib/sylla/stores/conversations';
import { savedItemsStore } from '@/lib/sylla/stores/saved-items';
import { clearLocalStudyData } from '@/lib/sylla/stores/settings';

const USER_A = scopeForUser('aaaaaaaa-0000-0000-0000-000000000001');
const USER_B = scopeForUser('bbbbbbbb-0000-0000-0000-000000000002');
const ANON = scopeForUser(null);

function say(text: string) {
  const c = createConversation(null);
  saveConversationMessages(c.id, [{ id: 'm', role: 'user', parts: [{ type: 'text', text }] }]);
  return c;
}

beforeEach(() => setStorageScope(null));
afterEach(() => setStorageScope(null));

describe('per-account chat history (shared browser)', () => {
  it('hides the previous student’s history after sign-out', () => {
    setStorageScope(USER_A);
    const a = say('A private question');
    setStorageScope(ANON); // signed out
    expect(conversationsStore.get()).toEqual([]);
    expect(getConversation(a.id)).toBeUndefined();
  });

  it('switching accounts never exposes another student’s history, and keeps each one', () => {
    setStorageScope(USER_A);
    const a = say('A question');
    setStorageScope(USER_B);
    expect(conversationsStore.get()).toEqual([]);
    const b = say('B question');
    expect(conversationsStore.get().map((c) => c.id)).toEqual([b.id]);
    setStorageScope(USER_A); // A signs back in on this device
    expect(conversationsStore.get().map((c) => c.id)).toEqual([a.id]);
  });

  it('keeps anonymous use apart from signed-in use, both ways', () => {
    setStorageScope(ANON);
    const anon = say('anonymous question');
    setStorageScope(USER_A);
    expect(getConversation(anon.id)).toBeUndefined();
    const a = say('A question');
    setStorageScope(ANON);
    expect(conversationsStore.get().map((c) => c.id)).toEqual([anon.id]);
    expect(getConversation(a.id)).toBeUndefined();
  });

  it('reads nothing and persists nothing before the session is known', () => {
    setStorageScope(USER_A);
    say('A question');
    setStorageScope(null);
    expect(conversationsStore.get()).toEqual([]);
    say('typed while loading');
    expect(Object.keys(window.localStorage).filter((k) => k.includes('conversations'))).toEqual([
      `sylla:v1:conversations:${USER_A}`,
    ]);
  });

  it('never shows, and never deletes, history saved before scoping existed', () => {
    const legacy = JSON.stringify([{ id: 'old', title: 'old', unitId: null, messages: [], createdAt: 1, updatedAt: 1 }]);
    window.localStorage.setItem('sylla:v1:conversations', legacy);
    for (const scope of [ANON, USER_A]) {
      setStorageScope(scope);
      expect(getConversation('old')).toBeUndefined();
    }
    say('new question');
    expect(window.localStorage.getItem('sylla:v1:conversations')).toBe(legacy);
  });

  it('"Clear local data" only clears the current account', () => {
    setStorageScope(USER_A);
    say('A question');
    setStorageScope(USER_B);
    say('B question');
    clearLocalStudyData();
    expect(conversationsStore.get()).toEqual([]);
    setStorageScope(USER_A);
    expect(conversationsStore.get()).toHaveLength(1);
  });

  it('scopes saved items the same way', () => {
    setStorageScope(USER_A);
    savedItemsStore.set([{ id: 's1' } as never]);
    setStorageScope(USER_B);
    expect(savedItemsStore.get()).toEqual([]);
  });
});

describe('StorageScopeSync', () => {
  it('follows the Supabase session: sign-in, sign-out and account switch', async () => {
    let authListener: ((event: string, session: unknown) => void) | undefined;
    vi.resetModules();
    vi.doMock('@/lib/supabase/client', () => ({
      getSupabaseBrowserClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: { user: { id: 'user-a' } } } }),
          onAuthStateChange: (cb: typeof authListener) => {
            authListener = cb;
            return { data: { subscription: { unsubscribe: () => {} } } };
          },
        },
      }),
    }));
    const store = await import('@/lib/sylla/store');
    const { StorageScopeSync } = await import('@/components/shell/StorageScopeSync');
    store.setStorageScope(null);

    render(createElement(StorageScopeSync));
    await waitFor(() => expect(store.getStorageScope()).toBe('u:user-a'));
    authListener!('SIGNED_OUT', null);
    expect(store.getStorageScope()).toBe('anon');
    authListener!('SIGNED_IN', { user: { id: 'user-b' } });
    expect(store.getStorageScope()).toBe('u:user-b');
    vi.doUnmock('@/lib/supabase/client');
  });

  it('uses the anonymous bucket when Supabase is not configured', async () => {
    vi.resetModules();
    vi.doMock('@/lib/supabase/client', () => ({ getSupabaseBrowserClient: () => null }));
    const store = await import('@/lib/sylla/store');
    const { StorageScopeSync } = await import('@/components/shell/StorageScopeSync');
    store.setStorageScope(null);
    render(createElement(StorageScopeSync));
    await waitFor(() => expect(store.getStorageScope()).toBe('anon'));
    vi.doUnmock('@/lib/supabase/client');
  });
});

