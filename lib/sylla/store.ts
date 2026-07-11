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

export interface LocalStore<T> {
  key: string;
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** React hook — returns `initial` on the server and until hydration. */
  use: () => T;
  clear: () => void;
}

export function createLocalStore<T>(name: string, initial: T): LocalStore<T> {
  const key = PREFIX + name;
  const listeners = new Set<() => void>();
  let cached: T = initial;
  let loaded = false;

  function read(): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      // Corrupt JSON or storage unavailable — fall back to the initial value.
      return initial;
    }
  }

  function get(): T {
    if (typeof window === 'undefined') return initial;
    if (!loaded) {
      cached = read();
      loaded = true;
    }
    return cached;
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function set(next: T | ((prev: T) => T)) {
    const value = typeof next === 'function' ? (next as (prev: T) => T)(get()) : next;
    cached = value;
    loaded = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full/blocked — in-memory state still updates for this session.
    }
    notify();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        loaded = false; // re-read on next get()
        listener();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }

  function use(): T {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- `use` is itself a hook; consumers call store.use() at the top level.
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  function clear() {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    cached = initial;
    loaded = true;
    notify();
  }

  const store: LocalStore<T> = { key, get, set, subscribe, use, clear };
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
