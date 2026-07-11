'use client';

import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  Layers,
  ListChecks,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { card } from '@/components/ui/classes';
import { EXAMPLE_PROMPTS } from '@/lib/sylla/config';
import { useConversations } from '@/lib/sylla/stores/conversations';
import { setDraft } from '@/lib/sylla/stores/drafts';
import { bumpNewChat } from '@/lib/sylla/stores/new-chat';
import { useActiveUnit } from '@/lib/sylla/stores/unit-context';
import { useHydrated } from '@/lib/sylla/store';
import { findUnit } from '@/lib/sylla/units';

const QUICK_ACTIONS = [
  {
    href: '/tools/summarise',
    icon: BookOpenText,
    title: 'Summarise material',
    description: 'Turn notes or readings into key points',
  },
  {
    href: '/tools/explain',
    icon: Sparkles,
    title: 'Explain a concept',
    description: 'Plain-language explanations at your depth',
  },
  {
    href: '/tools/flashcards',
    icon: Layers,
    title: 'Flashcards',
    description: 'Generate a deck from any topic',
  },
  {
    href: '/tools/quiz',
    icon: ListChecks,
    title: 'Quiz yourself',
    description: 'Practice questions with feedback',
  },
  {
    href: '/tools/planner',
    icon: CalendarClock,
    title: 'Plan your study',
    description: 'Break a goal into scheduled sessions',
  },
] as const;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late night session?';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const hydrated = useHydrated();
  const conversations = useConversations();
  const activeUnit = useActiveUnit();
  const router = useRouter();
  const recents = conversations.slice(0, 4);

  function startChatWithPrompt(prompt: string) {
    bumpNewChat();
    setDraft('draft', prompt);
    router.push('/chat');
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}</h1>
        <p className="mt-1.5 text-sm text-black/55 dark:text-white/55 sm:text-base">
          {activeUnit
            ? `Studying for ${activeUnit.code} — ${activeUnit.name}. What do you want to work on?`
            : 'What do you want to work on today?'}
        </p>
      </header>

      {/* Primary CTA */}
      <Link
        href="/chat"
        onClick={() => bumpNewChat()}
        className={`${card} mt-6 flex items-center gap-3 p-4 transition-colors hover:border-indigo-400 sm:p-5`}
      >
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white"
        >
          <MessageCircle size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Ask Sylla anything</span>
          <span className="block truncate text-xs text-black/50 dark:text-white/50">
            Study questions, task breakdowns, checklists, concepts…
          </span>
        </span>
        <ArrowRight size={16} className="shrink-0 text-black/40 dark:text-white/40" aria-hidden />
      </Link>

      {/* Prompt suggestions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => startChatWithPrompt(prompt)}
            className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs text-black/70 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/70 dark:hover:text-indigo-400"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <section className="mt-8" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-sm font-semibold text-black/70 dark:text-white/70">
          Study tools
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className={`${card} flex items-start gap-3 p-4 transition-colors hover:border-indigo-400`}
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-500"
              >
                <Icon size={17} strokeWidth={1.9} />
              </span>
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="mt-0.5 block text-xs text-black/50 dark:text-white/50">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent conversations */}
      <section className="mt-8" aria-labelledby="recents-heading">
        <div className="flex items-center justify-between">
          <h2 id="recents-heading" className="text-sm font-semibold text-black/70 dark:text-white/70">
            Recent conversations
          </h2>
          {recents.length > 0 && (
            <Link
              href="/chat"
              className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View all
            </Link>
          )}
        </div>
        {!hydrated ? (
          <div className={`${card} mt-3 h-24 animate-pulse`} aria-hidden />
        ) : recents.length === 0 ? (
          <p className={`${card} mt-3 px-4 py-5 text-sm text-black/50 dark:text-white/50`}>
            New here? Ask your first question and your conversations will show up in this list —
            they&apos;re stored on this device.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recents.map((conversation) => {
              const unit = findUnit(conversation.unitId);
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/chat/${conversation.id}`}
                    className={`${card} block px-4 py-3 transition-colors hover:border-indigo-400`}
                  >
                    <span className="block truncate text-sm font-medium">{conversation.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45 dark:text-white/45">
                      {conversation.messages.length} messages
                      {unit && (
                        <span className="rounded bg-indigo-500/10 px-1 py-px text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                          {unit.code}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
