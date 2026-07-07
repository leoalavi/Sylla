import type { Metadata } from 'next';
import { SyllaChat } from '@/components/sylla/SyllaChat';
import { SYLLA_DISCLAIMER, SYLLA_SUBTITLE, SYLLA_TITLE } from '@/lib/sylla/config';

export const metadata: Metadata = {
  title: SYLLA_TITLE,
  description: SYLLA_SUBTITLE,
};

export default function SyllaPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 text-center sm:mb-8">
        <p className="mb-3 inline-block rounded-full border border-indigo-500/25 bg-indigo-500/[0.08] px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Free preview
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Sylla — your study planning assistant
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-black/55 dark:text-white/55 sm:text-base">
          {SYLLA_SUBTITLE}
        </p>
      </header>

      <SyllaChat />

      <footer className="mt-4 text-center">
        <p className="text-xs text-black/40 dark:text-white/40">{SYLLA_DISCLAIMER}</p>
      </footer>
    </main>
  );
}
