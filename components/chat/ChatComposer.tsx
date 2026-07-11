'use client';

import { SendHorizonal, Square } from 'lucide-react';
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useSettings } from '@/lib/sylla/stores/settings';
import { setDraft, useDraft } from '@/lib/sylla/stores/drafts';

interface ChatComposerProps {
  /** Draft-persistence key ('draft' for a new conversation). */
  draftKey: string;
  onSend: (text: string) => void;
  onStop?: () => void;
  streaming: boolean;
  disabled: boolean;
  hint?: string;
}

/**
 * Multiline chat composer. Send with Enter (Shift+Enter = newline) or, when
 * "Enter sends" is off in settings, with Cmd/Ctrl+Enter. Drafts persist per
 * conversation so navigation doesn't eat typed input.
 */
export function ChatComposer({ draftKey, onSend, onStop, streaming, disabled, hint }: ChatComposerProps) {
  const value = useDraft(draftKey);
  const { sendOnEnter } = useSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Re-fit height when the draft is restored or cleared externally.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || disabled || streaming) return;
    setDraft(draftKey, '');
    onSend(text);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter') return;
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier || (sendOnEnter && !event.shiftKey)) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm focus-within:border-indigo-400 dark:border-white/15 dark:bg-white/[0.04]">
        <label htmlFor={`composer-${draftKey}`} className="sr-only">
          Message Sylla
        </label>
        <textarea
          id={`composer-${draftKey}`}
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder="Ask Sylla about your study plan…"
          onChange={(event) => setDraft(draftKey, event.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-[160px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-black/40 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-white/40"
        />
        {streaming && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:border-red-400 hover:text-red-600 dark:border-white/20 dark:hover:text-red-400"
          >
            <Square size={14} aria-hidden /> Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || streaming || value.trim().length === 0}
            aria-label="Send message"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizonal size={14} aria-hidden /> Send
          </button>
        )}
      </div>
      <p className="mt-2 min-h-4 text-center text-xs text-black/45 dark:text-white/45" aria-live="polite">
        {hint ??
          (sendOnEnter ? 'Enter to send · Shift+Enter for a new line' : 'Cmd/Ctrl+Enter to send')}
      </p>
    </form>
  );
}
