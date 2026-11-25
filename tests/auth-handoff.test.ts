import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSignInUrl } from '@/lib/sylla/config';
import { getAuthCookieOptions } from '@/lib/supabase/cookie-options';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSignInUrl', () => {
  it('sends the user to Syllabus Sync /login with a return address', () => {
    vi.stubEnv('NEXT_PUBLIC_SYLLABUS_SYNC_URL', 'https://www.syllabus-sync.app');
    const url = new URL(getSignInUrl('https://sylla.syllabus-sync.app/chat?id=1'));
    expect(url.origin + url.pathname).toBe('https://www.syllabus-sync.app/login');
    expect(url.searchParams.get('redirectTo')).toBe('https://sylla.syllabus-sync.app/chat?id=1');
  });

  it('falls back to the configured Sylla URL when no page is given (server render)', () => {
    vi.stubEnv('NEXT_PUBLIC_SYLLABUS_SYNC_URL', 'https://www.syllabus-sync.app');
    vi.stubEnv('NEXT_PUBLIC_SYLLA_URL', 'https://sylla.syllabus-sync.app');
    expect(new URL(getSignInUrl()).searchParams.get('redirectTo')).toBe(
      'https://sylla.syllabus-sync.app/',
    );
  });

  it('drops a non-http return address', () => {
    vi.stubEnv('NEXT_PUBLIC_SYLLA_URL', '');
    expect(new URL(getSignInUrl('javascript:alert(1)')).searchParams.has('redirectTo')).toBe(
      false,
    );
  });

  it('never points at a junk login host', () => {
    vi.stubEnv('NEXT_PUBLIC_SYLLABUS_SYNC_URL', 'not a url');
    expect(new URL(getSignInUrl()).origin).toBe('https://www.syllabus-sync.app');
  });
});

describe('getAuthCookieOptions', () => {
  it('shares the cookie across subdomains in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN', '.syllabus-sync.app');
    expect(getAuthCookieOptions()).toEqual({ domain: '.syllabus-sync.app' });
  });

  it('keeps host-only cookies outside production (localhost)', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN', '.syllabus-sync.app');
    expect(getAuthCookieOptions()).toBeUndefined();
  });

  it('is off when the domain is not configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN', '');
    expect(getAuthCookieOptions()).toBeUndefined();
  });
});
