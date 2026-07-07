# Sylla MVP (Phase 1)

## What Sylla is

Sylla is an AI academic/study assistant that helps students break down study
tasks, understand academic content, plan workload, and turn learning goals into
clear next steps.

Sylla is an **independent student-built assistant and is not an official
Macquarie University service**. It does not connect to university systems,
student records, grades, or enrolment data.

Sylla lives in its own Next.js app but shares its backend with
[Syllabus Sync](https://www.syllabus-sync.app): the **same Supabase project**
provides auth (and, in future phases, chat-history storage), and the sign-in
flow reuses Syllabus Sync's existing `/login` page.

## What was built in this phase

- `/sylla` — ChatGPT-style chat page (hero, chat panel, empty state, example
  prompt chips, message list, input, loading/error states, limit state). The
  root `/` redirects here.
- `/api/sylla/chat` — streaming chat API using the Vercel AI SDK
  (`streamText`) with Google Gemini Flash (`gemini-2.5-flash`) via
  `@ai-sdk/google`. Falls back to a mocked streaming response when no API key
  is configured.
- Anonymous free-message limit (3 user messages) tracked in `localStorage`,
  then a sign-in CTA linking to the Syllabus Sync login.
- Supabase browser/server clients (`lib/supabase/`) mirroring the Syllabus
  Sync patterns, ready for future persistence — no tables created yet.

### Key files

| Path | Purpose |
| --- | --- |
| `app/sylla/page.tsx` | Chat page (hero, disclaimer, chat panel) |
| `app/api/sylla/chat/route.ts` | Streaming chat endpoint + system prompt |
| `components/sylla/SyllaChat.tsx` | Client orchestrator (`useChat`) |
| `components/sylla/ChatMessage.tsx` | Message bubble |
| `components/sylla/ChatInput.tsx` | Textarea (Enter sends, Shift+Enter newline) |
| `components/sylla/PromptChips.tsx` | Example prompt chips |
| `components/sylla/UsageLimitNotice.tsx` | Limit-reached card + sign-in CTA |
| `components/sylla/SyllaEmptyState.tsx` | Empty conversation state |
| `lib/sylla/config.ts` | Limits, copy, sign-in URL helper |
| `lib/sylla/useAnonymousLimit.ts` | localStorage counter + Supabase session check |
| `lib/supabase/client.ts` / `server.ts` | Shared-project Supabase clients |

## Anonymous free-message limit

- Anonymous visitors may send **3** user messages.
- The count is stored in `localStorage` under `sylla_free_message_count`.
- After the limit: the input is replaced by a notice and a **Sign in with
  Syllabus Sync** CTA (`NEXT_PUBLIC_SYLLABUS_SYNC_URL` + `/login`).
- Signed-in Supabase users (same project as Syllabus Sync) bypass the limit.
- This is a **client-side UX gate, not a security boundary** — clearing
  localStorage resets it. Server-side enforcement is a Phase 2 item.

## How the chat API works

1. `SyllaChat` uses `useChat` (AI SDK UI) with a `DefaultChatTransport`
   pointing at `/api/sylla/chat`.
2. The route validates the `messages` payload (max 40 messages kept).
3. If `GOOGLE_GENERATIVE_AI_API_KEY` is set, `streamText` runs Gemini Flash
   with the Sylla system prompt and streams UI-message chunks back.
4. If the key is missing, a mocked reply is streamed word-by-word through the
   same protocol, so the UI is fully testable without a provider.

The system prompt constrains Sylla to study-assistant behaviour and forbids
claiming access to official university systems or records.

## Required environment variables

See `.env.example`. Summary:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For auth awareness | Same value as Syllabus Sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth awareness | Same value as Syllabus Sync |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For real AI replies | Mock streaming without it |
| `NEXT_PUBLIC_SYLLABUS_SYNC_URL` | Optional | Sign-in CTA base URL (defaults to production) |

## Current limitations

- Anonymous limit is client-side only (localStorage).
- No conversation persistence — refresh clears the chat.
- Signing in on Syllabus Sync (different domain) is not automatically visible
  to Sylla; sessions are cookie-scoped per domain. Sharing requires a common
  parent domain or an auth hand-off route (Phase 2).
- No rate limiting on the API route yet.
- No file upload, RAG, tools, or agent workflows.

## Future roadmap

1. Auth-gated saved conversations
2. Supabase chat history (`sylla_conversations`, `sylla_messages`)
3. File upload (document metadata in Supabase)
4. RAG over user-provided unit guides (vector search)
5. Deadline extraction
6. Study planner integration (Syllabus Sync)
7. Stronger privacy/security model (server-side limits, rate limiting, RLS)
