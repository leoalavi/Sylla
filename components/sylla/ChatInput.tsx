'use client';

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  /** Shown under the input while the anonymous allowance applies. */
  remainingLabel?: string;
}

export function ChatInput({ onSend, disabled, remainingLabel }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  // Enter sends, Shift+Enter inserts a newline.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm focus-within:border-indigo-400 dark:border-white/15 dark:bg-white/[0.04]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder="Ask Sylla about your study plan…"
          aria-label="Message Sylla"
          onChange={(event) => {
            setValue(event.target.value);
            // Grow with content up to ~5 lines.
            event.target.style.height = 'auto';
            event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
          }}
          onKeyDown={handleKeyDown}
          className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-black/40 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
      {remainingLabel && (
        <p className="mt-2 text-center text-xs text-black/45 dark:text-white/45">{remainingLabel}</p>
      )}
    </form>
  );
}
