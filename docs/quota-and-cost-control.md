# Gemini chat: cost control and abuse prevention

Sylla's chat endpoint (`/api/sylla/chat`) enforces per-tier request limits,
message-length caps, output-token caps, and file-upload restrictions
entirely **server-side**, backed by Postgres functions in the shared
Supabase project. This document covers the limits, the required
environment variables, how to deploy the schema, and how it was verified.

## Limits

| Tier | Limit | Value |
| --- | --- | --- |
| Anonymous | Requests per rolling 24h | 3 |
| Anonymous | Cooldown between requests | 15s |
| Anonymous | Max message length | 1,500 characters |
| Anonymous | Max output tokens | 400 |
| Anonymous | File uploads | Not allowed |
| Authenticated | Requests per rolling 24h | 20 |
| Authenticated | Requests per rolling 30 days | 200 |
| Authenticated | Requests per minute | 5 |
| Authenticated | Max message length | 4,000 characters |
| Authenticated | Max output tokens | 700 |
| Authenticated | Context sent to the model | Last 8 messages |
| Authenticated | Concurrent generations | 1 |
| File upload | Types | PDF, `.txt` only |
| File upload | Files per request | 1 |
| File upload | Max size | 5 MB |
| File upload | Max PDF pages | 20 |
| File upload | Uploads per rolling 24h | 2 |
| File upload | Extracted text cap sent to the model | 20,000 characters |

**Authoritative source:** the numbers above are hardcoded inside the
Postgres functions in
[`supabase/migrations/20260722222146_sylla_ai_usage_and_quota.sql`](../supabase/migrations/20260722222146_sylla_ai_usage_and_quota.sql)
— hardcoded rather than passed in from the app, so a compromised or
misconfigured app server cannot widen its own quota. `lib/sylla/quota/limits.ts`
duplicates these numbers for client-side UX hints only (character counters,
disabling the composer) — **it enforces nothing**; update both files by hand
if a limit ever changes.

## Architecture

```
route (app/api/sylla/chat/route.ts)
  → identity resolution (lib/sylla/quota/identity.ts)
  → input validation (lib/sylla/quota/validate.ts)          ── failures: no quota consumed
  → file text extraction (lib/sylla/files/validate-pdf.ts)  ── failures: no quota consumed
  → reserve quota (lib/sylla/quota/service.ts → Postgres)   ── atomic gate
  → streamText (maxOutputTokens capped per tier)
  → finalize via next/server after() (lib/sylla/quota/service.ts)
```

Every accepted request is inserted as `status='reserved'` in
`sylla_ai_requests` **before** the Gemini call starts. If streaming later
fails, errors, or the client disconnects, `after()` still runs the finalize
call and marks the row `succeeded`/`failed` with token usage when available.
If the server crashes before finalizing, the row stays `reserved` — and
still counts toward quota (not "forgiven"), which is the correct fail-safe
for a cost-control feature.

### Identity and its limits

- **Authenticated** requests are keyed by Supabase `user_id`.
- **Anonymous** requests are keyed by a durable random cookie (`sylla_aid`,
  httpOnly, 1-year) **combined with** a salted SHA-256 hash of the client
  IP — a request counts against the limit if **either** matches. Clearing
  cookies alone (same IP) or changing IP alone (same cookie, e.g. a VPN)
  does not reset the allowance.
- **This is best-effort abuse resistance, not perfect identity
  enforcement.** Shared IPs (campus wifi, NAT, mobile carriers) can cause
  unrelated users behind the same IP to share an allowance; VPNs/IP
  rotation combined with clearing cookies can still evade it. It raises the
  cost of casual abuse; it does not stop a determined attacker.
- Raw IP addresses are **never stored** — only the salted hash. Losing
  `SYLLA_IP_HASH_SALT` does not deanonymize past hashes (no rainbow-table
  reversal without the salt), but rotating the salt does silently reset the
  IP-linkage signal (cookie linkage is unaffected).

### Atomicity

Each reservation function (`sylla_reserve_chat_request`,
`sylla_reserve_upload_request`) takes a Postgres advisory transaction lock
(`pg_advisory_xact_lock`) on the identity before counting and inserting, so
concurrent requests from the same identity cannot race past a limit.

**This was verified against a real local Postgres 16 instance** (not just
reviewed by eye): the migration was applied to a throwaway cluster, every
limit was individually exercised (cooldown, both daily limits, the monthly
limit, the per-minute limit, upload limit, failed-request exclusion, the
stale-reserved fail-safe, and cleanup), and — critically — **8 genuinely
concurrent requests were fired in parallel at the exact quota boundary**:
exactly 1 succeeded and the other 7 were rejected, with zero double-booking.
The test cluster was destroyed afterward; nothing touched the shared
production Supabase project.

## Deploying the migration

This repository does **not** apply migrations to the shared Supabase
project automatically — it's shared production infrastructure with
Syllabus Sync. Apply it yourself:

```bash
# From the Syllabus Sync repo (which owns supabase/migrations), or via
# Supabase CLI linked to the shared project:
supabase db push
# — or paste the file's contents into the Supabase Studio SQL editor.
```

## Required environment variables

| Variable | Required for enforcement? | Exposure | Notes |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-only — never `NEXT_PUBLIC_` | Calls the `sylla_reserve_*`/`sylla_finalize_*` RPCs, which are granted to `service_role` only. |
| `SYLLA_IP_HASH_SALT` | Recommended | Server-only | Any long random string. Without it, the IP signal is skipped and anonymous limiting relies on the cookie alone (easier to bypass by clearing cookies). |
| `GEMINI_MODEL` | No | Server-only | Overrides the model (default `gemini-3.5-flash-lite`). Never client-selectable. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Server-only | Existing var — chat runs in mock mode without it. |

**Without `SUPABASE_SERVICE_ROLE_KEY` configured, quota enforcement is
skipped entirely** (logged loudly server-side) so local development still
works with zero Supabase setup — exactly like the rest of Sylla. **Do not
run a real `GOOGLE_GENERATIVE_AI_API_KEY` in production without the service
role key configured** — there is nothing else standing between an
anonymous visitor and unlimited Gemini calls.

## Recommended Google Cloud billing budget

Application-level quotas are the real enforcement; billing alerts are a
backstop for cost visibility, not a replacement for them (a budget alert
fires *after* spend has already happened).

1. **Cloud Billing → Budgets & alerts**: create a budget scoped to the
   project holding the Gemini API key. Size it from the limits above — e.g.
   worst case per user per day is `20 requests × 700 output tokens`; check
   current `gemini-3.5-flash-lite` pricing at
   [ai.google.dev/pricing](https://ai.google.dev/pricing) and multiply by
   your expected active-user count to size a monthly figure. Set alert
   thresholds at 50%, 90%, and 100%, emailed to whoever owns the deployment.
2. **APIs & Services → Quotas** (for the Generative Language API): set a
   hard per-minute/per-day request quota override as a second, independent
   backstop — Google enforces this at the API level regardless of any bug
   in Sylla's own logic.
3. Re-check both whenever a limit in the table above changes.

## Manual test checklist

Beyond the automated Vitest suite (`npm test` — validation, identity,
quota-service RPC-response mapping, PDF validation, error formatting), the
Postgres logic itself was verified as described above. If you change the
SQL, re-run at least:

- Anonymous: 3 requests succeed, 4th blocked (`anon_daily_limit`);
  immediate repeat blocked by `anon_cooldown` first.
- Authenticated: 5/minute, 20/day, 200/30-days, each blocking with the
  correct `resetAt`.
- Concurrency: fire several parallel requests for one user — only one
  succeeds; a stale lock (crashed request) self-heals after ~90s.
- File uploads: 2/day limit, encrypted/malformed/oversized PDFs rejected
  without consuming quota, anonymous users blocked from attaching at all.
- `failed`-status rows never count toward any limit; `reserved` rows always
  do (fail-safe).
