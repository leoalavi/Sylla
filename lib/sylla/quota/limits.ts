// Quota numbers for CLIENT-SIDE UX HINTS ONLY (character counters, composer
// disabling, help text). These are NOT authoritative — the real, enforced
// limits are hardcoded inside the SQL functions in
// supabase/migrations/…_sylla_ai_usage_and_quota.sql. If you change a
// number, update BOTH places; nothing keeps them in sync automatically.

export const ANON_LIMITS = {
  requestsPerDay: 3,
  cooldownSeconds: 15,
  maxMessageChars: 1500,
  maxOutputTokens: 400,
} as const;

export const AUTH_LIMITS = {
  requestsPerDay: 20,
  requestsPerMonth: 200,
  requestsPerMinute: 5,
  maxMessageChars: 4000,
  maxOutputTokens: 700,
  maxContextMessages: 8,
} as const;

export const UPLOAD_LIMITS = {
  uploadsPerDay: 2,
  maxFileBytes: 5 * 1024 * 1024,
  maxPdfPages: 20,
  maxExtractedChars: 20_000,
  acceptedMediaTypes: ['application/pdf', 'text/plain'] as const,
} as const;
