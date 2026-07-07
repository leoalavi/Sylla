'use client';

import { PromptChips } from '@/components/sylla/PromptChips';

export function SyllaEmptyState({
  onSelectPrompt,
  disabled,
}: {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-xl font-bold text-indigo-500"
      >
        S
      </span>
      <div>
        <h2 className="text-base font-semibold">What are you working on?</h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          Try one of these to get started:
        </p>
      </div>
      <PromptChips onSelect={onSelectPrompt} disabled={disabled} />
    </div>
  );
}
