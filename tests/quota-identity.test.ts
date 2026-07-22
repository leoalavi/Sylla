import { describe, expect, it } from 'vitest';
import {
  ANON_COOKIE_NAME,
  hashClientIp,
  resolveAnonymousCookieId,
  resolveIdentity,
  type CookieJar,
} from '@/lib/sylla/quota/identity';

function createJar(initial?: string): { jar: CookieJar; store: Map<string, string> } {
  const store = new Map<string, string>();
  if (initial) store.set(ANON_COOKIE_NAME, initial);
  const jar: CookieJar = {
    get: (name) => (store.has(name) ? { value: store.get(name)! } : undefined),
    set: (name, value) => store.set(name, value),
  };
  return { jar, store };
}

describe('resolveAnonymousCookieId', () => {
  it('generates and persists a new id when no cookie exists', () => {
    const { jar, store } = createJar();
    const { anonId, isNew } = resolveAnonymousCookieId(jar);
    expect(isNew).toBe(true);
    expect(anonId).toHaveLength(36); // uuid
    expect(store.get(ANON_COOKIE_NAME)).toBe(anonId);
  });

  it('reuses an existing cookie id without rewriting it', () => {
    const { jar, store } = createJar('existing-anon-id');
    const { anonId, isNew } = resolveAnonymousCookieId(jar);
    expect(anonId).toBe('existing-anon-id');
    expect(isNew).toBe(false);
    expect(store.get(ANON_COOKIE_NAME)).toBe('existing-anon-id');
  });

  it('generates a fresh id every call when no persistence happens between them (new visitor each time)', () => {
    const first = resolveAnonymousCookieId(createJar().jar);
    const second = resolveAnonymousCookieId(createJar().jar);
    expect(first.anonId).not.toBe(second.anonId);
  });
});

describe('hashClientIp', () => {
  it('returns null when no salt is configured (IP signal disabled)', () => {
    expect(hashClientIp('1.2.3.4', undefined)).toBeNull();
  });

  it('returns null when no forwarded-for header is present', () => {
    expect(hashClientIp(null, 'salt')).toBeNull();
  });

  it('produces a stable, salted hash for the same IP + salt', () => {
    const a = hashClientIp('203.0.113.5', 'my-salt');
    const b = hashClientIp('203.0.113.5', 'my-salt');
    expect(a).toBe(b);
    expect(a).not.toContain('203.0.113.5');
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hashes for different salts (rotatable)', () => {
    const a = hashClientIp('203.0.113.5', 'salt-one');
    const b = hashClientIp('203.0.113.5', 'salt-two');
    expect(a).not.toBe(b);
  });

  it('takes only the first IP from a multi-hop x-forwarded-for chain', () => {
    const a = hashClientIp('203.0.113.5, 10.0.0.1, 10.0.0.2', 'salt');
    const b = hashClientIp('203.0.113.5', 'salt');
    expect(a).toBe(b);
  });
});

describe('resolveIdentity', () => {
  it('returns an authenticated identity when a user id is present, ignoring cookies entirely', () => {
    const { jar } = createJar();
    const identity = resolveIdentity('user-123', jar, '203.0.113.5', 'salt');
    expect(identity).toEqual({ kind: 'authenticated', userId: 'user-123' });
  });

  it('returns an anonymous identity combining cookie id and ip hash when no user id is present', () => {
    const { jar } = createJar('anon-abc');
    const identity = resolveIdentity(null, jar, '203.0.113.5', 'salt');
    expect(identity.kind).toBe('anonymous');
    if (identity.kind === 'anonymous') {
      expect(identity.anonId).toBe('anon-abc');
      expect(identity.ipHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
