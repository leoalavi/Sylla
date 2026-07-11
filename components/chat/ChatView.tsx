'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessageItem, messageText } from '@/components/chat/ChatMessageItem';
import { SyllaEmptyState } from '@/components/sylla/SyllaEmptyState';
import { getConversation, createConversation, saveConversationMessages } from '@/lib/sylla/stores/conversations';
import { activeUnitStore } from '@/lib/sylla/stores/unit-context';
import { useAIConfigured } from '@/lib/sylla/use-ai-status';
import type { StoredMessage } from '@/lib/sylla/types';

function toStored(messages: UIMessage[]): StoredMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts
      .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
      .map((p) => ({ type: 'text' as const, text: p.text })),
  }));
}

function toUI(stored: StoredMessage[]): UIMessage[] {
  return stored.map((m) => ({ id: m.id, role: m.role, parts: m.parts }));
}

export interface ChatViewProps {
  /** null = fresh conversation; created (and URL updated) on first send. */
  conversationId: string | null;
  /** Standalone anonymous gate — rendered instead of the composer. */
  gated?: boolean;
  gateNotice?: ReactNode;
  composerHint?: string;
  onUserMessageSent?: () => void;
}

/**
 * Mode-agnostic chat core (shared by the standalone app and the future
 * embedded assistant). Streams via /api/sylla/chat and persists every turn
 * to the local conversation store.
 *
 * TODO(phase 2): for signed-in users, mirror persistence to Supabase
 * (sylla_conversations / sylla_messages) behind the same store API.
 */
export function ChatView({
  conversationId,
  gated = false,
  gateNotice,
  composerHint,
  onUserMessageSent,
}: ChatViewProps) {
  const initialMessages = useMemo(
    () => (conversationId ? toUI(getConversation(conversationId)?.messages ?? []) : []),
    [conversationId],
  );
  const idRef = useRef<string | null>(conversationId);

  const { messages, sendMessage, setMessages, status, error, regenerate, stop } = useChat({
    id: conversationId ?? undefined,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: '/api/sylla/chat' }),
  });

  const aiConfigured = useAIConfigured();
  const isBusy = status === 'submitted' || status === 'streaming';

  // Persist every message change to the local store.
  useEffect(() => {
    if (idRef.current && messages.length > 0) {
      saveConversationMessages(idRef.current, toStored(messages));
    }
  }, [messages]);

  // Auto-scroll that doesn't fight the user: only stick to the bottom while
  // the user is already near it.
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: status === 'streaming' ? 'auto' : 'smooth' });
    }
  }, [messages, status]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  function ensureConversation(): void {
    if (idRef.current) return;
    const conversation = createConversation(activeUnitStore.get());
    idRef.current = conversation.id;
    // Shallow URL update — keeps the in-flight stream alive; a reload lands
    // on /chat/[id] and rehydrates from the store.
    window.history.replaceState(null, '', `/chat/${conversation.id}`);
  }

  function handleSend(text: string) {
    if (gated || isBusy) return;
    ensureConversation();
    onUserMessageSent?.();
    pinnedRef.current = true;
    void sendMessage({ text });
  }

  function handleEditResend(index: number, newText: string) {
    if (isBusy) return;
    setMessages(messages.slice(0, index));
    onUserMessageSent?.();
    void sendMessage({ text: newText });
  }

  const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {aiConfigured === false && (
          <p
            role="status"
            className="mx-auto flex w-fit items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400"
          >
            <AlertTriangle size={13} aria-hidden />
            Development preview — no AI provider is configured, so replies are canned mock
            responses.
          </p>
        )}

        {messages.length === 0 ? (
          <SyllaEmptyState onSelectPrompt={handleSend} disabled={gated || isBusy} />
        ) : (
          messages.map((message, index) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              busy={isBusy && index === messages.length - 1}
              onRegenerate={
                !isBusy && index === lastAssistantIndex ? () => void regenerate() : undefined
              }
              onEditResend={
                message.role === 'user' && !isBusy
                  ? (newText) => handleEditResend(index, newText)
                  : undefined
              }
            />
          ))
        )}

        {status === 'submitted' && (
          <div
            role="status"
            className="flex items-center gap-2 pl-10 text-sm text-black/50 dark:text-white/50"
          >
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
              onClick={() => void regenerate()}
              className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-black/5 px-3 pt-3 pb-2 dark:border-white/10 sm:px-4">
        {gated ? (
          gateNotice
        ) : (
          <ChatComposer
            draftKey={conversationId ?? 'draft'}
            onSend={handleSend}
            onStop={() => void stop()}
            streaming={isBusy}
            disabled={false}
            hint={composerHint}
          />
        )}
      </div>
    </div>
  );
}

export { messageText };
