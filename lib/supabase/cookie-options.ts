// Shared-session cookie configuration.
//
// When Sylla is deployed at sylla.syllabus-sync.app and Syllabus Sync sets
// its Supabase auth cookie with Domain=.syllabus-sync.app, setting
// NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.syllabus-sync.app here makes both apps
// read/write the SAME session cookie — logging in on Syllabus Sync signs
// you into Sylla.
//
// Applied in production builds only, matching Syllabus Sync
// (lib/supabase/cookie-options.ts there). A browser rejects a
// Domain=.syllabus-sync.app cookie on localhost, so applying it in `next dev`
// silently broke token refresh and sign-out whenever the value was present in
// a local .env. Locally both apps run on localhost, where cookies are already
// shared across ports, so no domain is needed.
//
// The same option must be configured on the Syllabus Sync side; see
// docs/sylla-architecture.md → "Auth & identity".

export function getAuthCookieOptions(): { domain: string } | undefined {
  const domain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim();
  if (!domain || process.env.NODE_ENV !== 'production') return undefined;
  return { domain };
}
