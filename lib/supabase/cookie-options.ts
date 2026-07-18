// Shared-session cookie configuration.
//
// When Sylla is deployed at sylla.syllabus-sync.app and Syllabus Sync sets
// its Supabase auth cookie with Domain=.syllabus-sync.app, setting
// NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.syllabus-sync.app here makes both apps
// read/write the SAME session cookie — logging in on Syllabus Sync signs
// you into Sylla. Leave it unset for local dev (host-only cookies).
//
// The same option must be configured on the Syllabus Sync side; see
// docs/sylla-architecture.md → "Auth & identity".

export function getAuthCookieOptions(): { domain: string } | undefined {
  const domain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;
  return domain ? { domain } : undefined;
}
