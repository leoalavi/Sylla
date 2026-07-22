import { describe, expect, it } from 'vitest';
import {
  buildQuotaErrorBody,
  friendlyQuotaMessage,
  isAnonExhaustionCode,
  isLongWindowCode,
} from '@/lib/sylla/quota/errors';
import { parseQuotaError } from '@/lib/sylla/quota/parse-error';

describe('isAnonExhaustionCode', () => {
  it('is true for anon_daily_limit and anon_cooldown', () => {
    expect(isAnonExhaustionCode('anon_daily_limit')).toBe(true);
    expect(isAnonExhaustionCode('anon_cooldown')).toBe(true);
  });

  it('is false for authenticated-tier codes', () => {
    expect(isAnonExhaustionCode('auth_daily_limit')).toBe(false);
    expect(isAnonExhaustionCode('auth_concurrent')).toBe(false);
  });
});

describe('isLongWindowCode', () => {
  it('is true for day/month windows where Retry is pointless', () => {
    expect(isLongWindowCode('anon_daily_limit')).toBe(true);
    expect(isLongWindowCode('auth_daily_limit')).toBe(true);
    expect(isLongWindowCode('auth_monthly_limit')).toBe(true);
  });

  it('is false for short/transient codes where Retry still makes sense', () => {
    expect(isLongWindowCode('anon_cooldown')).toBe(false);
    expect(isLongWindowCode('auth_minute_limit')).toBe(false);
    expect(isLongWindowCode('auth_concurrent')).toBe(false);
    expect(isLongWindowCode('upload_daily_limit')).toBe(false);
  });
});

describe('friendlyQuotaMessage', () => {
  it('mentions signing in for the anonymous daily limit', () => {
    const resetAt = new Date(Date.now() + 3600_000).toISOString();
    const message = friendlyQuotaMessage('anon_daily_limit', 3, resetAt);
    expect(message).toContain('Sign in with Syllabus Sync');
    expect(message).toContain('3');
  });

  it('does not mention signing in for authenticated-tier codes', () => {
    const resetAt = new Date(Date.now() + 60_000).toISOString();
    const message = friendlyQuotaMessage('auth_minute_limit', 5, resetAt);
    expect(message).not.toContain('Sign in');
    expect(message).toContain('5');
  });

  it('describes the concurrent-generation case without a numeric limit reference', () => {
    const message = friendlyQuotaMessage('auth_concurrent', 1, new Date().toISOString());
    expect(message).toMatch(/finishing your last reply/);
  });
});

describe('buildQuotaErrorBody', () => {
  it('produces a structured body with error/code/limit/resetAt/message', () => {
    const resetAt = '2026-08-01T00:00:00.000Z';
    const body = buildQuotaErrorBody('auth_daily_limit', 20, resetAt);
    expect(body).toEqual({
      error: 'rate_limited',
      code: 'auth_daily_limit',
      limit: 20,
      resetAt,
      message: expect.stringContaining('20'),
    });
  });
});

describe('parseQuotaError (client-side reconstruction of the structured body)', () => {
  it('round-trips a real quota error body through Error.message', () => {
    const body = buildQuotaErrorBody('anon_daily_limit', 3, new Date().toISOString());
    const error = new Error(JSON.stringify(body));
    expect(parseQuotaError(error)).toEqual(body);
  });

  it('returns null for a plain-text validation error message', () => {
    const error = new Error('Your message is too long (1600 characters).');
    expect(parseQuotaError(error)).toBeNull();
  });

  it('returns null for JSON that is not a recognized quota error shape', () => {
    const error = new Error(JSON.stringify({ error: 'validation_error', message: 'bad input' }));
    expect(parseQuotaError(error)).toBeNull();
  });

  it('returns null for undefined error', () => {
    expect(parseQuotaError(undefined)).toBeNull();
  });
});
