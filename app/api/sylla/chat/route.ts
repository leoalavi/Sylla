import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { cookies, headers } from 'next/headers';
import { after } from 'next/server';
import { extractPdfText, extractPlainText } from '@/lib/sylla/files/validate-pdf';
import { parseDataUrl } from '@/lib/sylla/files/data-url';
import { buildQuotaErrorBody } from '@/lib/sylla/quota/errors';
import { resolveIdentity } from '@/lib/sylla/quota/identity';
import { ANON_LIMITS, AUTH_LIMITS } from '@/lib/sylla/quota/limits';
import { finalizeRequest, reserveChatQuota, reserveUploadQuota } from '@/lib/sylla/quota/service';
import { validateFileUploadPolicy, validateMessageLength, type FilePartLike } from '@/lib/sylla/quota/validate';
import { buildSyllaSystemPrompt } from '@/lib/sylla/prompts';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export const maxDuration = 30;

// Payload sanity limit before any tier-specific truncation below.
const MAX_MESSAGES = 40;

// Allow overriding the Gemini model via env without a code change/redeploy.
// Verified against the live ListModels endpoint for the configured project
// before use — see docs/quota-and-cost-control.md. Never let a client
// choose the model; this is the only place it is read.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

// ============================================================================
// Cost-control / abuse-prevention pipeline for Sylla's Gemini chat:
//   1. Parse + basic shape validation (400, no quota consumed).
//   2. Resolve identity: authenticated (Supabase user) or anonymous
//      (durable cookie + salted IP hash) — see lib/sylla/quota/identity.ts.
//   3. Validate message length + file policy (400/403, no quota consumed).
//   4. If a file is attached: extract text (rejecting encrypted/malformed/
//      oversized PDFs before any quota or Gemini call), then reserve upload
//      quota (429 on limit).
//   5. Reserve chat quota — the SOLE atomic gate against concurrent bypass,
//      enforced in Postgres (supabase/migrations/…_sylla_ai_usage_and_quota.sql).
//      429 with a structured {code, limit, resetAt} body on rejection.
//   6. Truncate context, call Gemini with maxOutputTokens capped per tier.
//   7. Finalize (mark succeeded/failed + record token usage) via after(),
//      so a request that began processing is logged even if the stream
//      later fails, errors, or the client disconnects.
//
// Quota enforcement REQUIRES SUPABASE_SERVICE_ROLE_KEY to be configured. In
// its absence (e.g. local dev without a linked Supabase project), all
// enforcement is skipped and a warning is logged — Sylla remains usable, but
// is NOT protected from abuse. Never run a real GOOGLE_GENERATIVE_AI_API_KEY
// in production without it configured.
// ============================================================================

function jsonError(message: string, status: number) {
  return Response.json({ error: 'validation_error', message }, { status });
}

function findLastUserMessage(messages: UIMessage[]): UIMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i];
  }
  return undefined;
}

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function fileParts(message: UIMessage) {
  return message.parts.filter(
    (p): p is Extract<typeof p, { type: 'file' }> => p.type === 'file',
  );
}

export async function POST(req: Request) {
  // ---- 1. Parse + shape validation ----
  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return jsonError('messages array is required', 400);
    }
    messages = body.messages.slice(-MAX_MESSAGES);
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const lastUserMessage = findLastUserMessage(messages);
  if (!lastUserMessage) {
    return jsonError('No user message found', 400);
  }
  const userText = textOf(lastUserMessage);
  const attachedFiles = fileParts(lastUserMessage);

  // ---- 2. Identity ----
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const identity = resolveIdentity(
    user?.id ?? null,
    cookieStore,
    requestHeaders.get('x-forwarded-for'),
    process.env.SYLLA_IP_HASH_SALT,
  );

  // ---- 3. Validation (no quota consumed on failure) ----
  const lengthCheck = validateMessageLength(userText, isAuthenticated);
  if (!lengthCheck.ok) return jsonError(lengthCheck.message, 400);

  const parsedFiles = attachedFiles
    .map((part) => ({ part, parsed: parseDataUrl(part.url) }))
    .filter((f): f is { part: (typeof attachedFiles)[number]; parsed: NonNullable<ReturnType<typeof parseDataUrl>> } =>
      f.parsed !== null,
    );
  if (attachedFiles.length > 0 && parsedFiles.length !== attachedFiles.length) {
    return jsonError('Attached file could not be read.', 400);
  }
  const filePolicyInput: FilePartLike[] = parsedFiles.map(({ part, parsed }) => ({
    mediaType: part.mediaType || parsed.mediaType,
    byteLength: parsed.buffer.length,
  }));
  const filePolicy = validateFileUploadPolicy(filePolicyInput, isAuthenticated);
  if (!filePolicy.ok) return jsonError(filePolicy.message, filePolicy.message.includes('Sign in') ? 403 : 400);

  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.warn(
      '[sylla/chat] Quota enforcement is DISABLED — SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
        'Do not run a real GOOGLE_GENERATIVE_AI_API_KEY in this state in production.',
    );
  }

  // ---- 4. File extraction + upload quota ----
  let fileTextBlock: string | null = null;
  if (parsedFiles.length > 0) {
    const { part, parsed } = parsedFiles[0];
    const extraction =
      parsed.mediaType === 'application/pdf'
        ? await extractPdfText(new Uint8Array(parsed.buffer))
        : extractPlainText(new Uint8Array(parsed.buffer));

    if (!extraction.ok) return jsonError(extraction.message, 422);

    if (admin) {
      // user is guaranteed non-null: validateFileUploadPolicy requires auth for files.
      const uploadDecision = await reserveUploadQuota(admin, user!.id);
      if (!uploadDecision.allowed) {
        const body = buildQuotaErrorBody(uploadDecision.code, uploadDecision.limit, uploadDecision.resetAt);
        return Response.json(body, { status: 429 });
      }
      after(() =>
        finalizeRequest(admin, uploadDecision.requestId, { status: 'succeeded', userId: user!.id }),
      );
    }

    fileTextBlock = `\n\n[Attached file: ${part.filename ?? 'upload'}]\n${extraction.text}${
      extraction.truncated ? '\n[Content truncated at the extraction limit]' : ''
    }`;
  }

  // ---- 5. Chat quota reservation (the atomic gate) ----
  let chatRequestId: string | null = null;
  if (admin) {
    const decision = await reserveChatQuota(admin, identity, {
      model: GEMINI_MODEL,
      inputChars: userText.length,
    });
    if (!decision.allowed) {
      const body = buildQuotaErrorBody(decision.code, decision.limit, decision.resetAt);
      return Response.json(body, { status: 429 });
    }
    chatRequestId = decision.requestId;
  }

  function finalize(status: 'succeeded' | 'failed', errorCode?: string, inputTokens?: number, outputTokens?: number) {
    if (!admin || !chatRequestId) return;
    const requestId = chatRequestId;
    after(() =>
      finalizeRequest(admin, requestId, {
        status,
        errorCode,
        inputTokens,
        outputTokens,
        userId: user?.id ?? null,
      }),
    );
  }

  // ---- 6. Build model messages: inject extracted file text, strip the raw
  //      file blob (never send it to Gemini), and trim context. ----
  let modelInputMessages = messages;
  if (fileTextBlock) {
    modelInputMessages = messages.map((m) =>
      m === lastUserMessage
        ? {
            ...m,
            parts: [
              ...m.parts.filter((p) => p.type !== 'file'),
              { type: 'text' as const, text: fileTextBlock! },
            ],
          }
        : m,
    );
  }
  if (isAuthenticated) {
    modelInputMessages = modelInputMessages.slice(-AUTH_LIMITS.maxContextMessages);
  }

  const maxOutputTokens = isAuthenticated ? AUTH_LIMITS.maxOutputTokens : ANON_LIMITS.maxOutputTokens;

  // ---- 7. Generate ----
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return createMockStreamResponse(() => finalize('succeeded'));
  }

  const result = streamText({
    model: google(GEMINI_MODEL),
    system: buildSyllaSystemPrompt(),
    messages: await convertToModelMessages(modelInputMessages),
    maxOutputTokens,
    onError: ({ error }) => {
      console.error('[sylla/chat] streamText error:', error);
      finalize('failed', 'stream_error');
    },
    onAbort: () => {
      finalize('failed', 'client_abort');
    },
    onFinish: ({ usage }) => {
      finalize('succeeded', undefined, usage.inputTokens ?? undefined, usage.outputTokens ?? undefined);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        console.error('[sylla/chat] stream conversion error:', error);
        return 'Sylla hit a problem generating a reply. Please try again.';
      },
    }),
  });
}

const MOCK_REPLY =
  "Hi! I'm Sylla, your study planning assistant. I'm running in preview mode right now because no AI provider is configured yet (the developer needs to set GOOGLE_GENERATIVE_AI_API_KEY). Once connected, I can help you plan study sessions, break assignments into smaller tasks, and build weekly checklists.";

/** Streams a canned reply word-by-word so the UI behaves like a real model. */
function createMockStreamResponse(onDone: () => void) {
  const stream = createUIMessageStream({
    async execute({ writer }) {
      const id = 'mock-reply';
      writer.write({ type: 'text-start', id });
      for (const chunk of MOCK_REPLY.split(/(?<= )/)) {
        writer.write({ type: 'text-delta', id, delta: chunk });
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      writer.write({ type: 'text-end', id });
      onDone();
    },
  });

  return createUIMessageStreamResponse({ stream });
}
