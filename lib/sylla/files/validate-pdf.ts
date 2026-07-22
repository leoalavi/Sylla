import { extractText, getDocumentProxy } from 'unpdf';
import { UPLOAD_LIMITS } from '@/lib/sylla/quota/limits';

// unpdf bundles its own pdfjs build with zero required runtime dependencies
// (its @napi-rs/canvas peer is only needed for image rendering, which this
// module never uses) — safe for serverless/edge without native binaries.

export type FileTextResult =
  | { ok: true; text: string; truncated: boolean }
  | { ok: false; message: string };

const UNREADABLE_MESSAGE = 'This PDF could not be read — it may be corrupted or password protected.';

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= UPLOAD_LIMITS.maxExtractedChars) return { text, truncated: false };
  return { text: text.slice(0, UPLOAD_LIMITS.maxExtractedChars), truncated: true };
}

/**
 * Opens and extracts text from a PDF, rejecting anything malformed,
 * encrypted/password-protected, or over the page limit — all BEFORE any
 * content reaches Gemini.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<FileTextResult> {
  let pdf;
  try {
    // pdfjs throws (PasswordException or a generic parse error) for
    // encrypted or malformed PDFs — both are rejected identically here since
    // neither should ever reach the model.
    pdf = await getDocumentProxy(bytes);
  } catch (error) {
    console.error('[sylla/files] failed to open PDF:', error);
    return { ok: false, message: UNREADABLE_MESSAGE };
  }

  if (pdf.numPages > UPLOAD_LIMITS.maxPdfPages) {
    return {
      ok: false,
      message: `This PDF has ${pdf.numPages} pages — the limit is ${UPLOAD_LIMITS.maxPdfPages}.`,
    };
  }

  try {
    const { text } = await extractText(pdf, { mergePages: true });
    return { ok: true, ...truncate(text) };
  } catch (error) {
    console.error('[sylla/files] failed to extract PDF text:', error);
    return { ok: false, message: UNREADABLE_MESSAGE };
  }
}

export function extractPlainText(bytes: Uint8Array): FileTextResult {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  return { ok: true, ...truncate(text) };
}
