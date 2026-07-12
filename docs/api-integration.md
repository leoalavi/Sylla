# Connecting the real AI to Sylla

Sylla ships with the full product UI working against mock AI. There are
exactly **two integration points**, and no UI changes are needed for either.

## 1. Study tools — implement `StudyToolService`

**Interface:** [`lib/sylla/ai/service.ts`](../lib/sylla/ai/service.ts)
**Switch point:** [`lib/sylla/ai/index.ts`](../lib/sylla/ai/index.ts) → `getStudyToolService()`

```ts
export interface StudyToolService {
  readonly providerName: 'mock' | 'live';
  summarise(input: SummariseInput): Promise<Summary>;
  explain(input: ExplainInput): Promise<Explanation>;
  generateFlashcards(input: FlashcardsInput): Promise<FlashcardSet>;
  generateQuiz(input: QuizInput): Promise<Quiz>;
  generateStudyPlan(input: PlanInput): Promise<StudyPlan>;
}
```

Recommended shape for the live implementation:

1. Add server routes (e.g. `app/api/sylla/tools/summarise/route.ts`, …) that
   call your model with the AI SDK's `generateObject` and a Zod schema per
   result type — the domain types in `lib/sylla/types.ts` are already
   serializable and can be mirrored 1:1 as schemas. Keys stay server-side.
2. Create `lib/sylla/ai/live-provider.ts` implementing `StudyToolService` by
   `fetch`ing those routes and returning the parsed domain objects. Throw
   `StudyToolError` (from `service.ts`) for failures you want the UI to offer
   a retry for — the shared `useToolRunner` handles the rest.
3. In `lib/sylla/ai/index.ts`, return the live provider (optionally falling
   back to mock when the key is missing):

   ```ts
   const live = createLiveStudyToolService();
   export function getStudyToolService(): StudyToolService {
     return live;
   }
   ```

Setting `providerName: 'live'` automatically removes every "Mock results
(dev)" badge. The Settings → Developer scenario switch only affects the mock
provider; delete `mock-provider.ts` (and its tests) when you no longer need it.

## 2. Chat — the existing streaming route

**File:** [`app/api/sylla/chat/route.ts`](../app/api/sylla/chat/route.ts)

Chat is already wired through the Vercel AI SDK: set
`GOOGLE_GENERATIVE_AI_API_KEY` and the route streams Gemini responses using
the system prompt from `lib/sylla/prompts.ts`; without the key it streams a
clearly-labelled mock reply. The client banner ("Development preview…") is
driven by `/api/sylla/status` and disappears automatically once the key is
present.

To use a different provider, swap the `google('gemini-2.5-flash')` model in
the route (or move to the Vercel AI Gateway with a `"provider/model"` string).

## Where later phases attach

| Capability | Attach point |
| --- | --- |
| Unit-aware prompts | `buildSyllaSystemPrompt(context)` in `lib/sylla/prompts.ts`; every tool input already carries `unit` |
| Real enrolled units | Replace `SAMPLE_UNITS` in `lib/sylla/units.ts` with Supabase data |
| Server persistence | Mirror the stores in `lib/sylla/stores/` to `sylla_conversations` / `sylla_messages` / `sylla_documents` |
| Server-side usage limits | Resolve the Supabase user in the chat route; log `sylla_usage_events` |
| Citations / RAG | `ChatMessageItem` already renders a sources placeholder per assistant message |
