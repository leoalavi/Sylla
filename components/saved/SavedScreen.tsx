'use client';

import {
  Bookmark,
  BookOpenText,
  CalendarClock,
  Layers,
  ListChecks,
  MessageCircle,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Markdown } from '@/components/chat/Markdown';
import { FlashcardViewer } from '@/components/tools/FlashcardViewer';
import { QuizPlayer } from '@/components/tools/QuizPlayer';
import { SummaryResultView } from '@/components/tools/SummaryResultView';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DetailDialog } from '@/components/ui/DetailDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { btnGhost, btnSecondary, card } from '@/components/ui/classes';
import { removeSavedItem, useSavedItems } from '@/lib/sylla/stores/saved-items';
import { useHydrated } from '@/lib/sylla/store';
import type { SavedItem, SavedItemKind } from '@/lib/sylla/types';

const KIND_META: Record<SavedItemKind, { label: string; icon: LucideIcon }> = {
  message: { label: 'Messages', icon: MessageCircle },
  summary: { label: 'Summaries', icon: BookOpenText },
  explanation: { label: 'Explanations', icon: Sparkles },
  flashcards: { label: 'Flashcards', icon: Layers },
  quiz: { label: 'Quizzes', icon: ListChecks },
  plan: { label: 'Plans', icon: CalendarClock },
};

function SavedItemDetail({ item }: { item: SavedItem }) {
  switch (item.kind) {
    case 'message':
      return <Markdown>{item.markdown}</Markdown>;
    case 'explanation':
      return <Markdown>{item.explanation.markdown}</Markdown>;
    case 'summary':
      return <SummaryResultView summary={item.summary} />;
    case 'flashcards':
      return <FlashcardViewer set={item.set} />;
    case 'quiz':
      return <QuizPlayer quiz={item.quiz} />;
    case 'plan':
      // Read-only snapshot — live, checkable plans live on the planner page.
      return (
        <ul className="space-y-2 text-sm">
          {item.plan.tasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-black/5 px-3 py-2 dark:border-white/10">
              {task.label}
              <span className="mt-0.5 block text-[11px] text-black/45 dark:text-white/45">
                {task.day} · ~{task.minutes} min
              </span>
            </li>
          ))}
        </ul>
      );
  }
}

export function SavedScreen() {
  const hydrated = useHydrated();
  const items = useSavedItems();
  const [filter, setFilter] = useState<SavedItemKind | 'all'>('all');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const presentKinds = [...new Set(items.map((item) => item.kind))];
  const filtered = filter === 'all' ? items : items.filter((item) => item.kind === filter);
  const viewing = items.find((item) => item.id === viewingId) ?? null;
  const deleting = items.find((item) => item.id === deletingId) ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saved</h1>
      <p className="mt-1.5 text-sm text-black/55 dark:text-white/55 sm:text-base">
        Messages, summaries, decks, quizzes, and plans you&apos;ve kept — stored on this device.
      </p>

      {!hydrated ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : items.length === 0 ? (
        <div className={`${card} mt-6`}>
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Use the Save action on chat replies or study-tool results and they'll be collected here."
          />
        </div>
      ) : (
        <>
          {presentKinds.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter saved items">
              <button
                type="button"
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  filter === 'all'
                    ? 'border-indigo-400 bg-indigo-500/[0.08] font-medium text-indigo-600 dark:text-indigo-400'
                    : 'border-black/10 dark:border-white/15'
                }`}
              >
                All ({items.length})
              </button>
              {presentKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setFilter(kind)}
                  aria-pressed={filter === kind}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    filter === kind
                      ? 'border-indigo-400 bg-indigo-500/[0.08] font-medium text-indigo-600 dark:text-indigo-400'
                      : 'border-black/10 dark:border-white/15'
                  }`}
                >
                  {KIND_META[kind].label}
                </button>
              ))}
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {filtered.map((item) => {
              const { icon: Icon, label: kindLabel } = KIND_META[item.kind];
              return (
                <li key={item.id} className={`${card} flex items-center gap-3 px-4 py-3`}>
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-500"
                  >
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-[11px] text-black/45 dark:text-white/45">
                      {kindLabel.replace(/s$/, '')} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button type="button" className={btnSecondary} onClick={() => setViewingId(item.id)}>
                    View
                  </button>
                  <button
                    type="button"
                    className={btnGhost}
                    aria-label={`Delete “${item.title}”`}
                    onClick={() => setDeletingId(item.id)}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <DetailDialog
        open={viewing !== null}
        title={viewing?.title ?? ''}
        onClose={() => setViewingId(null)}
      >
        {viewing && <SavedItemDetail item={viewing} />}
      </DetailDialog>

      <ConfirmDialog
        open={deleting !== null}
        title="Remove saved item?"
        description={`“${deleting?.title ?? ''}” will be removed from your saved items.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (deletingId) removeSavedItem(deletingId);
        }}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}
