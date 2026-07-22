import { describe, expect, it } from 'vitest';
import { ANON_LIMITS, AUTH_LIMITS, UPLOAD_LIMITS } from '@/lib/sylla/quota/limits';
import { validateFileUploadPolicy, validateMessageLength } from '@/lib/sylla/quota/validate';

describe('validateMessageLength', () => {
  it('allows anonymous messages up to the anon limit', () => {
    const text = 'a'.repeat(ANON_LIMITS.maxMessageChars);
    expect(validateMessageLength(text, false)).toEqual({ ok: true });
  });

  it('rejects anonymous messages one character over the anon limit', () => {
    const text = 'a'.repeat(ANON_LIMITS.maxMessageChars + 1);
    const result = validateMessageLength(text, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain(String(ANON_LIMITS.maxMessageChars));
      expect(result.message).toContain('Anonymous');
    }
  });

  it('allows authenticated messages up to the higher auth limit', () => {
    const text = 'a'.repeat(AUTH_LIMITS.maxMessageChars);
    expect(validateMessageLength(text, true)).toEqual({ ok: true });
  });

  it('rejects authenticated messages over the auth limit even though under the anon limit ceiling', () => {
    const text = 'a'.repeat(AUTH_LIMITS.maxMessageChars + 1);
    const result = validateMessageLength(text, true);
    expect(result.ok).toBe(false);
  });
});

describe('validateFileUploadPolicy', () => {
  it('allows zero files regardless of auth state', () => {
    expect(validateFileUploadPolicy([], false)).toEqual({ ok: true });
    expect(validateFileUploadPolicy([], true)).toEqual({ ok: true });
  });

  it('rejects any file from anonymous users', () => {
    const result = validateFileUploadPolicy([{ mediaType: 'application/pdf', byteLength: 100 }], false);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Sign in');
  });

  it('rejects more than one file', () => {
    const files = [
      { mediaType: 'application/pdf', byteLength: 100 },
      { mediaType: 'text/plain', byteLength: 100 },
    ];
    const result = validateFileUploadPolicy(files, true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('one file');
  });

  it('rejects unsupported media types', () => {
    const result = validateFileUploadPolicy([{ mediaType: 'image/png', byteLength: 100 }], true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('PDF and plain-text');
  });

  it('rejects files over the size limit', () => {
    const result = validateFileUploadPolicy(
      [{ mediaType: 'application/pdf', byteLength: UPLOAD_LIMITS.maxFileBytes + 1 }],
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/too large/);
  });

  it('allows a single valid PDF at exactly the size limit for authenticated users', () => {
    const result = validateFileUploadPolicy(
      [{ mediaType: 'application/pdf', byteLength: UPLOAD_LIMITS.maxFileBytes }],
      true,
    );
    expect(result).toEqual({ ok: true });
  });

  it('allows a single valid .txt file for authenticated users', () => {
    const result = validateFileUploadPolicy([{ mediaType: 'text/plain', byteLength: 500 }], true);
    expect(result).toEqual({ ok: true });
  });
});
