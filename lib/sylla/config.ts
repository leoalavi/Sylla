// Shared Sylla constants (client + server safe).

/** User messages an anonymous visitor may send before the sign-in gate. */
export const FREE_MESSAGE_LIMIT = 3;

/** localStorage key tracking anonymous usage. */
export const FREE_MESSAGE_STORAGE_KEY = 'sylla_free_message_count';

export const SYLLA_TITLE = 'Sylla — your study planning assistant';

export const SYLLA_SUBTITLE =
  'Break down study tasks, understand academic content, and turn your learning goals into clear next steps.';

export const SYLLA_DISCLAIMER =
  'Sylla is an independent student-built assistant and is not an official Macquarie University service.';

export const LIMIT_REACHED_MESSAGE =
  'You’ve reached the free preview limit. Sign in to continue chatting and unlock longer conversations in a future version.';

export const EXAMPLE_PROMPTS = [
  'Help me plan what to study today',
  'Break this assignment into smaller tasks',
  'Explain this unit information in simpler words',
  'Create a weekly study checklist',
] as const;

/**
 * Sign-in entry point. Sylla does not have its own auth UI — it reuses the
 * existing Syllabus Sync /login flow (same Supabase project).
 *
 * TODO(phase 2): share the Supabase session across both apps (same parent
 * domain + shared cookie domain, or an auth callback route here) so signing
 * in on Syllabus Sync is immediately visible to Sylla.
 */
export function getSignInUrl(): string {
  const base = process.env.NEXT_PUBLIC_SYLLABUS_SYNC_URL ?? 'https://www.syllabus-sync.app';
  return `${base.replace(/\/$/, '')}/login`;
}
