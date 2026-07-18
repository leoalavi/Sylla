'use client';

import { Check, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  deleteConversation,
  renameConversation,
  useConversations,
} from '@/lib/sylla/stores/conversations';
import { bumpNewChat } from '@/lib/sylla/stores/new-chat';
import { findUnit } from '@/lib/sylla/units';
import { useHydrated } from '@/lib/sylla/store';
import { Skeleton } from '@/components/ui/Skeleton';

function relativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
}

/** Chat history — inline panel on desktop, sheet content on mobile. */
export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const hydrated = useHydrated();
  const conversations = useConversations();
  const pathname = usePathname();
  const router = useRouter();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No conversations yet"
        description="Your chat history is stored on this device. Start a conversation and it will appear here."
      />
    );
  }

  const deleting = conversations.find((c) => c.id === deletingId);

  return (
    <div className="flex flex-col gap-1 p-2" aria-label="Conversation history">
      <button
        type="button"
        onClick={() => {
          bumpNewChat();
          router.push('/chat');
          onNavigate?.();
        }}
        className="mb-1 flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary "
      >
        <Plus size={15} aria-hidden /> New conversation
      </button>

      {conversations.map((conversation) => {
        const active = pathname === `/chat/${conversation.id}`;
        const unit = findUnit(conversation.unitId);

        if (renamingId === conversation.id) {
          return (
            <form
              key={conversation.id}
              className="flex items-center gap-1 rounded-xl border border-primary/60 px-2 py-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                renameConversation(conversation.id, renameText);
                setRenamingId(null);
              }}
            >
              <label htmlFor={`rename-${conversation.id}`} className="sr-only">
                Rename conversation
              </label>
              <input
                id={`rename-${conversation.id}`}
                autoFocus
                value={renameText}
                onChange={(event) => setRenameText(event.target.value)}
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
              <button type="submit" aria-label="Save name" className="rounded p-1 text-primary hover:bg-primary/10">
                <Check size={14} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Cancel rename"
                onClick={() => setRenamingId(null)}
                className="rounded p-1 text-faint hover:bg-hover"
              >
                <X size={14} aria-hidden />
              </button>
            </form>
          );
        }

        return (
          <div
            key={conversation.id}
            className={`group relative flex items-center rounded-xl transition-colors ${
 active
 ? 'bg-primary/10'
 : 'hover:bg-hover'
 }`}
          >
            <Link
              href={`/chat/${conversation.id}`}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className="min-w-0 flex-1 px-3 py-2"
            >
              <span
                className={`block truncate text-sm ${
 active ? 'font-medium text-primary' : ''
 }`}
              >
                {conversation.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                {relativeTime(conversation.updatedAt)}
                {unit && (
                  <span className="rounded bg-primary/10 px-1 py-px text-[10px] font-medium text-primary">
                    {unit.code}
                  </span>
                )}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-0.5 pr-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                aria-label={`Rename “${conversation.title}”`}
                onClick={() => {
                  setRenameText(conversation.title);
                  setRenamingId(conversation.id);
                }}
                className="rounded p-1 text-faint hover:bg-hover hover:text-foreground"
              >
                <Pencil size={13} aria-hidden />
              </button>
              <button
                type="button"
                aria-label={`Delete “${conversation.title}”`}
                onClick={() => setDeletingId(conversation.id)}
                className="rounded p-1 text-faint hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete conversation?"
        description={`“${deleting?.title ?? ''}” will be removed from this device. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deletingId) return;
          const wasActive = pathname === `/chat/${deletingId}`;
          deleteConversation(deletingId);
          if (wasActive) {
            bumpNewChat();
            router.push('/chat');
          }
        }}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}
