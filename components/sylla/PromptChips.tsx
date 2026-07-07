'use client';

import { EXAMPLE_PROMPTS } from '@/lib/sylla/config';

export function PromptChips({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {EXAMPLE_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs text-black/70 transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/70 dark:hover:text-indigo-400 sm:text-sm"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
