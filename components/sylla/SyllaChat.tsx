'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef } from 'react';
import { ChatInput } from '@/components/sylla/ChatInput';
import { ChatMessage } from '@/components/sylla/ChatMessage';
import { SyllaEmptyState } from '@/components/sylla/SyllaEmptyState';
import { UsageLimitNotice } from '@/components/sylla/UsageLimitNotice';
import { useAnonymousLimit } from '@/lib/sylla/useAnonymousLimit';

export function SyllaChat() {
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/sylla/chat' }),
  });
  const { ready, isSignedIn, remaining, limitReached, recordMessageSent } = useAnonymousLimit();

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  const isBusy = status === 'submitted' || status === 'streaming';

  function handleSend(text: string) {
    if (limitReached || isBusy) return;
    recordMessageSent();
    void sendMessage({ text });
  }

  const remainingLabel =
    ready && !isSignedIn && !limitReached
      ? `${remaining} free ${remaining === 1 ? 'message' : 'messages'} remaining`
      : undefined;

  return (
    <section className="flex w-full flex-1 flex-col overflow-hidden rounded-3xl border border-black/10 bg-white/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.02]">
      <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <SyllaEmptyState onSelectPrompt={handleSend} disabled={limitReached || isBusy} />
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
        {limitReached ? (
          <UsageLimitNotice />
        ) : (
          <ChatInput onSend={handleSend} disabled={isBusy || !ready} remainingLabel={remainingLabel} />
        )}
      </div>
    </section>
  );
}
