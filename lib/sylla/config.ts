// Shared Sylla constants (client + server safe).

/** User messages an anonymous visitor may send before the sign-in gate. */
export const FREE_MESSAGE_LIMIT = 3;

/** localStorage key tracking anonymous usage. */
export const FREE_MESSAGE_STORAGE_KEY = 'sylla_free_message_count';

export const SYLLA_TITLE = 'Sylla — the AI study assistant for Syllabus Sync';

export const SYLLA_SUBTITLE =
  'Sylla helps turn your units, notes, and study goals into summaries, flashcards, quizzes, and study plans.';

export const SYLLA_DISCLAIMER =
  'Sylla is an independent student-built assistant and is not an official Macquarie University service.';

export const LIMIT_REACHED_MESSAGE =
  'You’ve used your free preview messages. Use your Syllabus Sync account to unlock Sylla and keep chatting.';

export const EXAMPLE_PROMPTS = [
  'Help me plan what to study today',
  'Break this assignment into smaller tasks',
  'Explain this unit information in simpler words',
  'Create a weekly study checklist',
] as const;

const DEFAULT_SYLLABUS_SYNC_URL = 'https://www.syllabus-sync.app';

/**
 * Sign-in entry point. Sylla does not have its own auth UI — it reuses the
 * existing Syllabus Sync /login flow (same Supabase project, same accounts).
 *
 * The env value is validated (must parse as an http/https URL) so a
 * misconfigured deployment can never redirect users to a junk destination.
 *
 * Session sharing across apps: code-side support ships via
 * NEXT_PUBLIC_AUTH_COOKIE_DOMAIN (see lib/supabase/cookie-options.ts);
 * the remaining work is deployment configuration, documented in
 * docs/sylla-architecture.md → "Auth & identity".
 */
export function getSignInUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SYLLABUS_SYNC_URL ?? DEFAULT_SYLLABUS_SYNC_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('bad protocol');
    return `${url.origin}/login`;
  } catch {
    return `${DEFAULT_SYLLABUS_SYNC_URL}/login`;
  }
}
