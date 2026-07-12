# Sylla Dual-Mode Architecture

Sylla ships in two deployment modes that share one backend, one user base,
and one chat core. This document is the reference for how the pieces fit and
what each future phase plugs into.

> Sylla is an independent student-built assistant and is not an official
> Macquarie University service. Neither mode connects to official university
> systems, student records, grades, or enrolment data.

## The two modes

### 1. Standalone Sylla app (this repository — live today)

A public website where anyone can try Sylla.

- Anonymous visitors get a **3-message free preview**, tracked client-side in
  `localStorage` (`sylla_free_message_count`).
- After the limit, the input is replaced by a sign-in CTA that links to the
  existing **Syllabus Sync `/login`** page — Sylla has no auth UI of its own.
- Signed-in users (same Supabase user base as Syllabus Sync) bypass the limit;
  future phases add saved conversations and RAG over uploaded study materials.

### 2. Embedded Sylla inside Syllabus Sync (future)

A Notion-AI-style assistant mounted inside the main Syllabus Sync app
(floating button / side panel).

- Users are **already signed in** via the host app's Supabase session — the
  anonymous preview gate never renders in this mode.
- Usage is unlimited/expanded relative to the anonymous preview (server-side
  fair-use limits arrive with `sylla_usage_events`).
- Becomes context-aware over time: tasks, study planner, deadlines, and unit
  information the user has added to Syllabus Sync are injected into the
  prompt as *user-owned app data*.

## Shared layers

| Layer | Shared artifact | Notes |
| --- | --- | --- |
| Chat UI core | `components/chat/ChatView.tsx` | Mode-agnostic: messages, streaming, markdown, persistence, message actions. Knows nothing about auth or limits. |
| Mode policy (standalone) | `components/chat/ChatScreen.tsx` | Wraps ChatView with history panel, anonymous gate + sign-in CTA. |
| Mode policy (embedded) | `components/sylla/SyllaFloatingButton.tsx` | Preview of the embedded launcher; not mounted in the standalone app. |
| AI logic (chat) | `app/api/sylla/chat/route.ts` + `lib/sylla/prompts.ts` | One endpoint, one system prompt, one UI-message stream protocol for both modes. `buildSyllaSystemPrompt(context)` is where embedded context attaches. |
| AI logic (study tools) | `lib/sylla/ai/` (`StudyToolService`) | Typed interface + mock provider; the live provider replaces one file — see docs/api-integration.md. |
| Auth & users | Shared Supabase project | Identical `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` values in both apps → one account works everywhere. |
| Data (future) | `sylla_*` tables | See schema sketch below; RLS-scoped to the owning user, readable by both modes. |
| Config & copy | `lib/sylla/config.ts` | Limits, example prompts, disclaimer, sign-in URL. |
| Usage gate | `lib/sylla/usage-limit.ts` | Standalone-only hook (localStorage + Supabase session check). |

How the code physically reaches Syllabus Sync later is an integration detail
with two workable options: extract `components/sylla` + `lib/sylla` into a
small shared package (npm workspace/monorepo — cleanest), or vendor a copy
into Syllabus Sync's `features/sylla/` (fastest, acceptable while the surface
is this small). The refactor keeps every shared file free of standalone-app
imports so either path is mechanical.

## Auth & identity

Both apps point at the **same Supabase project**, so user identity is already
unified — the open question is only *session visibility* across origins,
because Supabase auth cookies are scoped per domain.

### Option A — subdomain of one parent domain (RECOMMENDED)

- `syllabus-sync.app` → main Syllabus Sync app
- `sylla.syllabus-sync.app` → standalone Sylla app

With both apps under one parent domain, the Supabase auth cookie can be set
with `Domain=.syllabus-sync.app` (cookie options on the SSR clients in *both*
apps), making a Syllabus Sync login immediately visible to Sylla and vice
versa. Near-zero code; this is the preferred deployment.

TODOs when implementing Option A:

- [ ] Deploy standalone Sylla at `sylla.syllabus-sync.app`.
- [ ] Set the shared cookie domain in both apps' Supabase client/server
      configs (`cookieOptions: { domain: '.syllabus-sync.app' }`).
- [ ] Update `NEXT_PUBLIC_SYLLABUS_SYNC_URL` and verify the post-login
      redirect returns the user to Sylla.
- [ ] Confirm Syllabus Sync's CSRF origin checks accept the subdomain.

### Option B — separate, unrelated domains

Requires an explicit auth hand-off: an OAuth-style redirect from Sylla to
Syllabus Sync's login with a callback route on Sylla that exchanges a
one-time code/token for a session (or Supabase's PKCE flow with the redirect
allowlisted). Strictly more moving parts and more security surface (token in
transit, open-redirect hardening, allowlist management). **Not recommended**
unless branding demands an unrelated domain.

Phase 1 status: neither is implemented. The sign-in CTA simply links to the
Syllabus Sync login; a user returning to Sylla is only "seen" if the session
is visible on Sylla's origin (true in same-origin local dev, and true in
production once Option A ships).

## Future database schema (not created yet)

All tables live in the shared Supabase project with RLS scoping rows to
`auth.uid()`. Both modes read/write the same rows — a conversation started on
the standalone site appears inside the embedded assistant.

| Table | Purpose |
| --- | --- |
| `sylla_conversations` | One row per conversation: owner, title, mode created in, timestamps. |
| `sylla_messages` | Ordered messages per conversation: role, parts/text, token counts. |
| `sylla_documents` | Metadata for user-uploaded study materials (unit guides, notes): storage path, status, embedding progress. |
| `sylla_usage_events` | Per-user usage log for fair-use limits, abuse prevention, and product analytics. |

## Future capabilities and where they attach

- **Saved conversations / history** → local history shipped; `ChatView` gains
  `initialMessages` + conversation-id props (TODO already in the component);
  the API route persists turns for signed-in users.
- **File upload + RAG** → upload UI in both modes; documents land in Supabase
  Storage with `sylla_documents` metadata; retrieval results feed
  `buildSyllaSystemPrompt(context)` (TODO in `lib/sylla/prompts.ts`).
- **Syllabus Sync context integration (embedded)** → host app passes tasks,
  study-planner items, deadlines, and unit info into the chat request; the
  route forwards them as `SyllaPromptContext`. Always user-owned app data,
  never official university records.
- **Server-side limits** → the route resolves the Supabase user, enforces
  anonymous/fair-use limits, and logs `sylla_usage_events` (TODO in the
  route).

## Phase 1 behaviour (unchanged by this refactor)

- 3 free anonymous messages, tracked in `localStorage`.
- Sign-in CTA to Syllabus Sync `/login` after the limit.
- No Supabase tables, no chat persistence, no RAG, no uploads.
- Mocked streaming response when `GOOGLE_GENERATIVE_AI_API_KEY` is absent.
- No official Macquarie University branding or claims; the UI carries the
  independence disclaimer.
