'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, type ReactNode } from 'react';
import { ChatInput } from '@/components/sylla/ChatInput';
import { ChatMessage } from '@/components/sylla/ChatMessage';
import { SyllaEmptyState } from '@/components/sylla/SyllaEmptyState';

export interface SyllaChatPanelProps {
  /** Chat endpoint; both modes speak the same UI-message stream protocol. */
  api?: string;
  /** Blocks sending without replacing the input (e.g. while hydrating). */
  disabled?: boolean;
  /** Subtle helper text under the input ("2 free messages remaining"). */
  inputHint?: string;
  /** When true, `gateNotice` renders in place of the input. */
  gated?: boolean;
  /** What to show instead of the input when `gated` (sign-in CTA, etc.). */
  gateNotice?: ReactNode;
  /** Called with the text of every user message that is actually sent. */
  onMessageSent?: (text: string) => void;
  className?: string;
}

/**
 * Mode-agnostic chat core shared by both Sylla deployments:
 *
 * - Standalone app: wrapped by `SyllaChat`, which supplies the anonymous
 *   free-message gate and the Syllabus Sync sign-in CTA.
 * - Embedded assistant (future, inside Syllabus Sync): wrapped by
 *   `SyllaFloatingButton` / a sidebar panel with no gate — the host app's
 *   Supabase session identifies the user.
 *
 * This component deliberately knows nothing about usage limits, auth, or
 * persistence; those are mode policies injected via props.
 *
 * TODO(phase 2): accept an initial `messages` array + conversation id so
 * saved conversations (sylla_conversations / sylla_messages) can hydrate it.
 */
export function SyllaChatPanel({
  api = '/api/sylla/chat',
  disabled = false,
  inputHint,
  gated = false,
  gateNotice,
  onMessageSent,
  className = '',
}: SyllaChatPanelProps) {
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  const isBusy = status === 'submitted' || status === 'streaming';

  function handleSend(text: string) {
    if (gated || disabled || isBusy) return;
    onMessageSent?.(text);
    void sendMessage({ text });
  }

  return (
    <section
      className={`flex w-full flex-1 flex-col overflow-hidden rounded-3xl border border-black/10 bg-white/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.02] ${className}`}
    >
      <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <SyllaEmptyState onSelectPrompt={handleSend} disabled={gated || disabled || isBusy} />
        ) : (
          messages.map((message) => <ChatMessage key={message.id} message={message} />)
        )}

        {status === 'submitted' && (
          <div className="flex items-center gap-2 pl-10 text-sm text-black/50 dark:text-white/50">
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            </span>
            Sylla is thinking…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mx-auto flex w-fit items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-600 dark:text-red-400"
          >
            Something went wrong. Please try again.
            <button
              type="button"
              onClick={() => regenerate()}
              className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-black/5 p-3 dark:border-white/10 sm:p-4">
        {gated ? (
          gateNotice
        ) : (
          <ChatInput onSend={handleSend} disabled={disabled || isBusy} remainingLabel={inputHint} />
        )}
      </div>
    </section>
  );
}
