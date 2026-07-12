# Sylla — your study planning assistant

Sylla is an AI-powered university study assistant in the
[Syllabus Sync](https://www.syllabus-sync.app) ecosystem. It helps students
summarise material, understand difficult concepts, generate flashcards and
practice quizzes, and turn goals into scheduled study plans.

> Sylla is an independent student-built assistant and is **not** an official
> Macquarie University service. It never presents invented university data as
> real, and flags uncertainty instead of guessing.

Sylla runs standalone (planned home: `sylla.syllabus-sync.app`) and shares its
Supabase project and user accounts with Syllabus Sync. A future phase embeds
the same chat core inside Syllabus Sync as an assistant panel.

## What works today

- **Chat** — streaming conversations with markdown/code/table rendering,
  local history, rename/delete, copy, edit-and-resend, regenerate, and
  stop-generation. Anonymous visitors get a 3-message preview, then a
  sign-in CTA (Syllabus Sync accounts).
- **Study tools** — summarise, explain a concept, flashcards, quiz &
  practice questions, and a study planner with checkable sessions.
- **Context** — pick a unit so Sylla knows what you're studying (sample
  units for now; real Syllabus Sync units connect later).
- **Saved items** — keep messages, summaries, decks, quizzes; filter/view/delete.
- **Settings** — theme (system/light/dark), chat & study preferences,
  data clearing, developer mock-scenario switch.
- **Persistence** — everything is stored locally in the browser
  (`localStorage`, versioned `sylla:v1:*` keys). No database tables yet.

**AI status:** study tools run on a deterministic **mock provider** (clearly
badged in the UI). Chat streams through `/api/sylla/chat`, which uses Gemini
when `GOOGLE_GENERATIVE_AI_API_KEY` is set and otherwise streams a canned
mock reply — the app fully works with **no API key**. See
[docs/api-integration.md](docs/api-integration.md) for connecting the real AI.

## Stack

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Vercel AI SDK (`useChat`/`streamText`) · Supabase (`@supabase/ssr`, shared
with Syllabus Sync) · Vitest + Testing Library.

## Getting started

```bash
npm install
cp .env.example .env.local   # all values optional — see below
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Vitest suite |
| `npm run build` | Production build |

### Environment variables (all optional in dev)

| Variable | Effect when set |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables sign-in awareness (same values as Syllabus Sync) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chat uses the live Gemini model instead of the mock reply |
| `NEXT_PUBLIC_SYLLABUS_SYNC_URL` | Base URL for the sign-in CTA (defaults to production) |

## Structure

```
app/                  Routes: / (home), /chat, /chat/[id], /tools/*, /saved,
                      /settings, /api/sylla/chat, /api/sylla/status
components/
  shell/              App shell, nav, theme, unit-context picker
  chat/               ChatView (core), composer, messages, history, markdown
  tools/              ToolPage + useToolRunner + per-tool forms and viewers
  home|saved|settings UI per route
  ui/                 ConfirmDialog, DetailDialog, EmptyState, Skeleton, class recipes
lib/sylla/
  types.ts            Domain models (conversations, decks, quizzes, plans…)
  ai/                 StudyToolService interface + mock provider  <- API boundary
  store.ts, stores/   Typed localStorage stores (SSR-safe)
  config.ts, prompts.ts, units.ts, usage-limit.ts
lib/supabase/         Browser/server clients + session hook (shared project)
tests/                Vitest suites
docs/                 Architecture + API integration guide
```

## Known limitations

- Study-tool results are mock data (badged); chat is mock without an API key.
- All persistence is per-browser — no cross-device sync until the Supabase
  phase (`sylla_conversations`, `sylla_messages`, `sylla_documents`,
  `sylla_usage_events`).
- The anonymous 3-message limit is a client-side UX gate, not a security
  boundary (server-side enforcement is planned).
- Signing in on Syllabus Sync isn't visible to Sylla until both apps share a
  cookie domain (see [docs/sylla-architecture.md](docs/sylla-architecture.md)).
- No file upload, RAG, or real course-data retrieval yet — these are
  intentionally API-dependent phases.

## Docs

- [docs/sylla-architecture.md](docs/sylla-architecture.md) — dual-mode
  (standalone + embedded) architecture, shared auth options, future schema.
- [docs/api-integration.md](docs/api-integration.md) — exactly where and how
  to connect the real AI provider.
- [docs/sylla-mvp.md](docs/sylla-mvp.md) — Phase 1 history (superseded).
