import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { buildSyllaSystemPrompt } from '@/lib/sylla/prompts';

export const maxDuration = 30;

// Payload sanity limits (this is a soft gate; the real anonymous limit is
// enforced client-side in Phase 1).
const MAX_MESSAGES = 40;

// This route is the single AI entry point for BOTH deployment modes:
// - standalone Sylla (anonymous preview + signed-in users)
// - embedded Sylla inside Syllabus Sync (always signed in)
//
// TODO(phase 2): resolve the signed-in user via lib/supabase/server.ts
// createServerClient(); enforce the anonymous limit + per-user rate limiting
// server-side, and record a row in sylla_usage_events.
// TODO(phase 2): persist conversations for signed-in users
// (sylla_conversations / sylla_messages, RLS-scoped to the user).
// TODO(embedded): accept an optional context payload (tasks, deadlines,
// units) from the Syllabus Sync host app and pass it to
// buildSyllaSystemPrompt(context).
// TODO(rag): retrieve relevant chunks from the user's uploaded documents
// (sylla_documents) and inject them into the prompt context.

export async function POST(req: Request) {
  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'messages array is required' }, { status: 400 });
    }
    messages = body.messages.slice(-MAX_MESSAGES);
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // TODO: connect the model — set GOOGLE_GENERATIVE_AI_API_KEY in .env.local
  // (see .env). Until then we stream a mocked response so the UI is
  // fully exercisable in development.
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return createMockStreamResponse();
  }

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: buildSyllaSystemPrompt(),
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

const MOCK_REPLY =
  "Hi! I'm Sylla, your study planning assistant. I'm running in preview mode right now because no AI provider is configured yet (the developer needs to set GOOGLE_GENERATIVE_AI_API_KEY). Once connected, I can help you plan study sessions, break assignments into smaller tasks, and build weekly checklists.";

/** Streams a canned reply word-by-word so the UI behaves like a real model. */
function createMockStreamResponse() {
  const stream = createUIMessageStream({
    async execute({ writer }) {
      const id = 'mock-reply';
      writer.write({ type: 'text-start', id });
      for (const chunk of MOCK_REPLY.split(/(?<= )/)) {
        writer.write({ type: 'text-delta', id, delta: chunk });
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      writer.write({ type: 'text-end', id });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
