# Sylla — your study planning assistant

Sylla is an AI academic/study assistant that helps students break down study
tasks, understand academic content, plan workload, and turn learning goals
into clear next steps.

> Sylla is an independent student-built assistant and is **not** an official
> Macquarie University service.

Sylla is a companion app to [Syllabus Sync](https://www.syllabus-sync.app):
it shares the same Supabase project (auth + future chat history) and reuses
the Syllabus Sync sign-in flow.

## Stack

- Next.js (App Router) · React · TypeScript · Tailwind CSS
- Vercel AI SDK (`streamText` / `useChat`) with Google Gemini Flash
- Supabase (`@supabase/ssr`) — shared with Syllabus Sync

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Gemini keys
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/sylla`.

Without `GOOGLE_GENERATIVE_AI_API_KEY`, the chat API streams a mocked
response so the UI is fully testable.

## Docs

See [docs/sylla-mvp.md](docs/sylla-mvp.md) for what Phase 1 includes, the
anonymous free-message limit, API design, env variables, and the roadmap.
