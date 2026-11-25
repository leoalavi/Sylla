'use client';

import { useSyncExternalStore } from 'react';

// Tiny typed localStorage store, generalizing the pattern established in
// lib/sylla/usage-limit.ts: module-level singletons exposed to React via
// useSyncExternalStore so reads are hydration-safe (the server snapshot is
// always `initial`) and cross-tab updates arrive via the `storage` event.
//
// This is Sylla's Phase-1 persistence adapter. When Supabase persistence
// lands (sylla_conversations / sylla_messages / …), stores that need to sync
// server-side swap this adapter without changing their React API.

const PREFIX = 'sylla:v1:';

const registry = new Map<string, { clear: () => void }>();

// ---------------------------------------------------------------------------
// Per-account storage scope.
//
// Private stores (chat history, drafts, saved items, study plans, active unit)
// are saved under a key that includes the current account, so on a shared
// browser one student never sees another's Sylla history, and signed-out use
// is kept apart from every account:
//   sylla:v1:<name>:u:<user id>   signed in
//   sylla:v1:<name>:anon          signed out
// Until the session check finishes the scope is null: scoped stores read as
// empty and keep writes in memory only, so nothing is shown or saved under the
// wrong account. StorageScopeSync (components/shell) sets the scope.
//
// Data saved before scoping existed (sylla:v1:<name>, no suffix) cannot be
// attributed to an account, so it is never read here. It is left in place,
// not deleted, until a decision is made about it.
// ---------------------------------------------------------------------------

let storageScope: string | null = null;
const scopeListeners = new Set<() => void>();

/** `u:<userId>` when signed in, `anon` when signed out. */
export function scopeForUser(userId: string | null | undefined): string {
  return userId ? `u:${userId}` : 'anon';
}

export function getStorageScope(): string | null {
  return storageScope;
}

/** Switches every scoped store to another account's (or anonymous) data. */
export function setStorageScope(next: string | null): void {
  if (next === storageScope) return;
  storageScope = next;
  scopeListeners.forEach((listener) => listener());
}

export interface LocalStore<T> {
  /** Current localStorage key; null for a scoped store before the scope is known. */
  readonly key: string | null;
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** React hook — returns `initial` on the server and until hydration. */
  use: () => T;
  clear: () => void;
}

export interface LocalStoreOptions<T> {
  /**
   * Maps whatever was persisted (possibly by an older app version) onto the
   * current shape — e.g. merging new fields over defaults. Without this, a
   * stale persisted object is returned as-is.
   */
  migrate?: (persisted: unknown) => T;
  /** Private per-account data: stored under the current storage scope. */
  scoped?: boolean;
}

export function createLocalStore<T>(
  name: string,
  initial: T,
  options: LocalStoreOptions<T> = {},
): LocalStore<T> {
  const baseKey = PREFIX + name;
  const listeners = new Set<() => void>();
  let cached: T = initial;
  // The key the cache was loaded for; undefined = not loaded yet.
  let loadedKey: string | null | undefined;

  function currentKey(): string | null {
    if (!options.scoped) return baseKey;
    return storageScope ? `${baseKey}:${storageScope}` : null;
  }

  function read(key: string | null): T {
    if (key === null) return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed: unknown = JSON.parse(raw);
      return options.migrate ? options.migrate(parsed) : (parsed as T);
    } catch {
      // Corrupt JSON or storage unavailable — fall back to the initial value.
      return initial;
    }
  }

  function get(): T {
    if (typeof window === 'undefined') return initial;
    const key = currentKey();
    if (loadedKey !== key) {
      cached = read(key);
      loadedKey = key;
    }
    return cached;
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function set(next: T | ((prev: T) => T)) {
    const value = typeof next === 'function' ? (next as (prev: T) => T)(get()) : next;
    const key = currentKey();
    cached = value;
    loadedKey = key;
    if (key !== null) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage full/blocked — in-memory state still updates for this session.
      }
    }
    notify();
  }

  if (options.scoped) {
    // Re-read (and re-render) whenever the account changes.
    scopeListeners.add(() => {
      loadedKey = undefined;
      notify();
    });
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === currentKey()) {
        loadedKey = undefined; // re-read on next get()
        listener();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }

  // `use` is itself a hook; consumers call store.use() at the top level.
  function use(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  /** Clears the current account's (or anonymous) copy only. */
  function clear() {
    const key = currentKey();
    if (key !== null) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    cached = initial;
    loadedKey = key;
    notify();
  }

  const store: LocalStore<T> = {
    get key() {
      return currentKey();
    },
    get,
    set,
    subscribe,
    use,
    clear,
  };
  registry.set(name, store);
  return store;
}

/** Names of stores wiped by Settings → "Clear local data". */
export function clearStores(names: string[]) {
  for (const name of names) registry.get(name)?.clear();
}

const noopSubscribe = () => () => {};

/** True only on the client, after hydration. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
