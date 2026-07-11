'use client';

import { History, MessageCircleOff, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ChatView } from '@/components/chat/ChatView';
import { ConversationList } from '@/components/chat/ConversationList';
import { UsageLimitNotice } from '@/components/sylla/UsageLimitNotice';
import { EmptyState } from '@/components/ui/EmptyState';
import { btnPrimary } from '@/components/ui/classes';
import { useAnonymousLimit } from '@/lib/sylla/usage-limit';
import { useConversations } from '@/lib/sylla/stores/conversations';
import { useActiveUnit } from '@/lib/sylla/stores/unit-context';
import { useHydrated } from '@/lib/sylla/store';

/**
 * Standalone chat route: history panel + ChatView + the standalone-only
 * anonymous free-message gate. The embedded assistant composes ChatView
 * directly and never renders this screen.
 */
export function ChatScreen({ conversationId }: { conversationId: string | null }) {
  const { ready, isSignedIn, remaining, limitReached, recordMessageSent } = useAnonymousLimit();
  const activeUnit = useActiveUnit();
  const [historyOpen, setHistoryOpen] = useState(false);
  const hydrated = useHydrated();
  const conversations = useConversations();

  const conversationMissing =
    conversationId !== null && hydrated && !conversations.some((c) => c.id === conversationId);

  const composerHint =
    ready && !isSignedIn && !limitReached
      ? `${remaining} free ${remaining === 1 ? 'message' : 'messages'} remaining`
      : undefined;

  return (
    <div className="flex h-full min-h-0">
      {/* Desktop history panel */}
      <aside
        aria-label="Chat history"
        className="hidden w-64 shrink-0 overflow-y-auto border-r border-black/5 dark:border-white/10 lg:block"
      >
        <ConversationList />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Mobile toolbar: history toggle + active context */}
        <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-1.5 dark:border-white/10 lg:hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-expanded={historyOpen}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-black/60 hover:bg-black/[0.05] dark:text-white/60 dark:hover:bg-white/[0.08]"
          >
            {historyOpen ? <X size={14} aria-hidden /> : <History size={14} aria-hidden />}
            {historyOpen ? 'Close history' : 'History'}
          </button>
          {activeUnit && (
            <span className="truncate rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              {activeUnit.code}
            </span>
          )}
        </div>

        {historyOpen && (
          <div className="absolute inset-x-0 top-10 bottom-0 z-30 overflow-y-auto bg-[var(--background)] lg:hidden">
            <ConversationList onNavigate={() => setHistoryOpen(false)} />
          </div>
        )}

        {conversationMissing ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={MessageCircleOff}
              title="Conversation not found"
              description="It may have been deleted, or it belongs to a different device — history is stored locally for now."
              action={
                <Link href="/chat" className={btnPrimary}>
                  Start a new chat
                </Link>
              }
            />
          </div>
        ) : (
          <ChatView
            conversationId={conversationId}
            gated={limitReached}
            gateNotice={<UsageLimitNotice />}
            composerHint={composerHint}
            onUserMessageSent={recordMessageSent}
          />
        )}
      </div>
    </div>
  );
}
