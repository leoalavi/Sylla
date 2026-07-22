import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UPLOAD_LIMITS } from '@/lib/sylla/quota/limits';

const getDocumentProxy = vi.fn();
const extractText = vi.fn();

vi.mock('unpdf', () => ({
  getDocumentProxy: (...args: unknown[]) => getDocumentProxy(...args),
  extractText: (...args: unknown[]) => extractText(...args),
}));

const { extractPdfText, extractPlainText } = await import('@/lib/sylla/files/validate-pdf');

beforeEach(() => {
  getDocumentProxy.mockReset();
  extractText.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('extractPdfText', () => {
  it('rejects a PDF that throws while opening (encrypted or malformed) before any text extraction is attempted', async () => {
    getDocumentProxy.mockRejectedValue(new Error('PasswordException'));
    const result = await extractPdfText(new Uint8Array([1, 2, 3]));
    expect(result).toEqual({ ok: false, message: expect.stringMatching(/corrupted or password protected/) });
    expect(extractText).not.toHaveBeenCalled();
  });

  it('rejects a PDF over the page limit without extracting text', async () => {
    getDocumentProxy.mockResolvedValue({ numPages: UPLOAD_LIMITS.maxPdfPages + 5 });
    const result = await extractPdfText(new Uint8Array());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(String(UPLOAD_LIMITS.maxPdfPages));
    expect(extractText).not.toHaveBeenCalled();
  });

  it('allows a PDF at exactly the page limit', async () => {
    getDocumentProxy.mockResolvedValue({ numPages: UPLOAD_LIMITS.maxPdfPages });
    extractText.mockResolvedValue({ text: 'short body', totalPages: UPLOAD_LIMITS.maxPdfPages });
    const result = await extractPdfText(new Uint8Array());
    expect(result).toEqual({ ok: true, text: 'short body', truncated: false });
  });

  it('rejects a PDF that fails during text extraction after opening successfully', async () => {
    getDocumentProxy.mockResolvedValue({ numPages: 3 });
    extractText.mockRejectedValue(new Error('corrupt stream'));
    const result = await extractPdfText(new Uint8Array());
    expect(result).toEqual({ ok: false, message: expect.stringMatching(/corrupted or password protected/) });
  });

  it('truncates extracted text at the configured character cap', async () => {
    getDocumentProxy.mockResolvedValue({ numPages: 1 });
    const longText = 'x'.repeat(UPLOAD_LIMITS.maxExtractedChars + 500);
    extractText.mockResolvedValue({ text: longText, totalPages: 1 });
    const result = await extractPdfText(new Uint8Array());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toHaveLength(UPLOAD_LIMITS.maxExtractedChars);
      expect(result.truncated).toBe(true);
    }
  });

  it('does not truncate text under the character cap', async () => {
    getDocumentProxy.mockResolvedValue({ numPages: 1 });
    extractText.mockResolvedValue({ text: 'well within limits', totalPages: 1 });
    const result = await extractPdfText(new Uint8Array());
    expect(result).toEqual({ ok: true, text: 'well within limits', truncated: false });
  });
});

describe('extractPlainText', () => {
  it('decodes UTF-8 bytes to text', () => {
    const bytes = new TextEncoder().encode('hello from a text file');
    const result = extractPlainText(bytes);
    expect(result).toEqual({ ok: true, text: 'hello from a text file', truncated: false });
  });

  it('truncates plain text at the configured character cap', () => {
    const longText = 'y'.repeat(UPLOAD_LIMITS.maxExtractedChars + 100);
    const bytes = new TextEncoder().encode(longText);
    const result = extractPlainText(bytes);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toHaveLength(UPLOAD_LIMITS.maxExtractedChars);
      expect(result.truncated).toBe(true);
    }
  });
});
