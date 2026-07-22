// Pure input validation — no DB calls, so a failure here never consumes
// quota (the route only calls the quota service after these pass).

import { ANON_LIMITS, AUTH_LIMITS, UPLOAD_LIMITS } from '@/lib/sylla/quota/limits';

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateMessageLength(text: string, isAuthenticated: boolean): ValidationResult {
  const max = isAuthenticated ? AUTH_LIMITS.maxMessageChars : ANON_LIMITS.maxMessageChars;
  if (text.length > max) {
    return {
      ok: false,
      message: `Your message is too long (${text.length} characters). ${isAuthenticated ? 'Signed-in' : 'Anonymous'} messages are limited to ${max} characters.`,
    };
  }
  return { ok: true };
}

export interface FilePartLike {
  mediaType: string;
  /** Byte length of the decoded file, computed by the caller from the data URL. */
  byteLength: number;
}

export function validateFileUploadPolicy(
  files: FilePartLike[],
  isAuthenticated: boolean,
): ValidationResult {
  if (files.length === 0) return { ok: true };

  if (!isAuthenticated) {
    return { ok: false, message: 'Sign in with Syllabus Sync to attach files to a chat.' };
  }
  if (files.length > 1) {
    return { ok: false, message: 'Attach one file per message.' };
  }
  const [file] = files;
  const accepted: readonly string[] = UPLOAD_LIMITS.acceptedMediaTypes;
  if (!accepted.includes(file.mediaType)) {
    return { ok: false, message: 'Only PDF and plain-text (.txt) files are supported.' };
  }
  if (file.byteLength > UPLOAD_LIMITS.maxFileBytes) {
    const maxMb = (UPLOAD_LIMITS.maxFileBytes / (1024 * 1024)).toFixed(0);
    return { ok: false, message: `File is too large — the limit is ${maxMb} MB.` };
  }
  return { ok: true };
}
