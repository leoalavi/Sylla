import type { QuotaErrorBody, QuotaErrorCode } from '@/lib/sylla/quota/errors';

const KNOWN_CODES: readonly QuotaErrorCode[] = [
  'anon_cooldown',
  'anon_daily_limit',
  'auth_minute_limit',
  'auth_daily_limit',
  'auth_monthly_limit',
  'auth_concurrent',
  'upload_daily_limit',
];

/**
 * The AI SDK's chat transport surfaces a non-2xx response body verbatim as
 * `error.message`. Quota rejections are sent as a structured JSON body (see
 * lib/sylla/quota/errors.ts); this recovers that structure client-side so
 * the UI can show a tailored message instead of a generic fallback.
 * Returns null for plain-text validation errors or unrelated network errors.
 */
export function parseQuotaError(error: Error | undefined): QuotaErrorBody | null {
  if (!error?.message) return null;
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'code' in parsed &&
      KNOWN_CODES.includes((parsed as { code: unknown }).code as QuotaErrorCode)
    ) {
      return parsed as QuotaErrorBody;
    }
  } catch {
    // Not JSON — a plain validation message or generic fetch error.
  }
  return null;
}
