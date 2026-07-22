import crypto from 'node:crypto';

// Anonymous identity = a durable cookie id combined with a salted IP hash.
// A request counts against the anonymous limit if EITHER matches an
// existing row, so clearing cookies (same IP) or changing IP (same cookie)
// alone does not reset the allowance. This is best-effort abuse resistance,
// NOT perfect identity enforcement — shared IPs (NAT, campus wifi, mobile
// carriers) and VPNs mean it can both over- and under-count real users.

export const ANON_COOKIE_NAME = 'sylla_aid';
const ANON_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Minimal shape of Next's cookies() store — kept narrow so tests can pass a plain object. */
export interface CookieJar {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: Record<string, unknown>): void;
}

export function resolveAnonymousCookieId(jar: CookieJar): { anonId: string; isNew: boolean } {
  const existing = jar.get(ANON_COOKIE_NAME)?.value;
  if (existing) return { anonId: existing, isNew: false };

  const anonId = crypto.randomUUID();
  jar.set(ANON_COOKIE_NAME, anonId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ANON_COOKIE_MAX_AGE_SECONDS,
  });
  return { anonId, isNew: true };
}

/**
 * Salted SHA-256 hash of the client IP — never store or log a raw IP.
 * Returns null (skipping the IP signal) if SYLLA_IP_HASH_SALT is unset or no
 * IP header is present (e.g. local dev without a proxy in front of Next).
 */
export function hashClientIp(forwardedForHeader: string | null, salt: string | undefined): string | null {
  if (!salt) return null;
  const ip = forwardedForHeader?.split(',')[0]?.trim();
  if (!ip) return null;
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export type Identity =
  | { kind: 'authenticated'; userId: string }
  | { kind: 'anonymous'; anonId: string; ipHash: string | null };

export function resolveIdentity(
  userId: string | null,
  jar: CookieJar,
  forwardedForHeader: string | null,
  ipHashSalt: string | undefined,
): Identity {
  if (userId) return { kind: 'authenticated', userId };
  const { anonId } = resolveAnonymousCookieId(jar);
  const ipHash = hashClientIp(forwardedForHeader, ipHashSalt);
  return { kind: 'anonymous', anonId, ipHash };
}
