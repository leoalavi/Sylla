import { describe, expect, it } from 'vitest';
import { parseDataUrl } from '@/lib/sylla/files/data-url';

describe('parseDataUrl', () => {
  it('parses a valid base64 data URL', () => {
    const payload = Buffer.from('hello world').toString('base64');
    const result = parseDataUrl(`data:text/plain;base64,${payload}`);
    expect(result).not.toBeNull();
    expect(result?.mediaType).toBe('text/plain');
    expect(result?.buffer.toString('utf-8')).toBe('hello world');
  });

  it('parses a data URL with a charset parameter', () => {
    const payload = Buffer.from('with charset').toString('base64');
    const result = parseDataUrl(`data:text/plain;charset=utf-8;base64,${payload}`);
    expect(result?.mediaType).toBe('text/plain');
    expect(result?.buffer.toString('utf-8')).toBe('with charset');
  });

  it('returns null for a non-data URL', () => {
    expect(parseDataUrl('https://example.com/file.pdf')).toBeNull();
  });

  it('returns null for a data URL that is not base64-encoded', () => {
    expect(parseDataUrl('data:text/plain,hello')).toBeNull();
  });

  it('reports the correct decoded byte length for size-limit checks', () => {
    const bytes = new Uint8Array(1024).fill(65);
    const payload = Buffer.from(bytes).toString('base64');
    const result = parseDataUrl(`data:application/pdf;base64,${payload}`);
    expect(result?.buffer.length).toBe(1024);
  });
});
