import type { Metadata } from 'next';
import {
  BookOpenText,
  CalendarClock,
  Layers,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Study tools',
};

const TOOLS = [
  {
    href: '/tools/summarise',
    icon: BookOpenText,
    title: 'Summarise material',
    description: 'Paste notes or readings and get an overview, key points, and important terms.',
  },
  {
    href: '/tools/explain',
    icon: Sparkles,
    title: 'Explain a concept',
    description: 'Structured plain-language explanations at introductory, intermediate, or advanced depth.',
  },
  {
    href: '/tools/flashcards',
    icon: Layers,
    title: 'Flashcards',
    description: 'Generate a front/back deck from any topic, optionally grounded in your own material.',
  },
  {
    href: '/tools/quiz',
    icon: ListChecks,
    title: 'Quiz & practice questions',
    description: 'Multiple-choice and short-answer questions with feedback and a score at the end.',
  },
  {
    href: '/tools/planner',
    icon: CalendarClock,
    title: 'Study planner',
    description: 'Turn a goal and deadline into a checklist of scheduled study sessions.',
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Study tools</h1>
      <p className="mt-1.5 text-sm text-black/55 dark:text-white/55 sm:text-base">
        Focused modes for the study jobs chat is clumsy at.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TOOLS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3.5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-colors hover:border-indigo-400 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-500"
            >
              <Icon size={18} strokeWidth={1.9} />
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-black/50 dark:text-white/50">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
