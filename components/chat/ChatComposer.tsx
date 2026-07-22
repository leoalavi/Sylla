'use client';

import { convertFileListToFileUIParts, type FileUIPart } from 'ai';
import { Paperclip, SendHorizonal, Square, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { UPLOAD_LIMITS } from '@/lib/sylla/quota/limits';
import { useSettings } from '@/lib/sylla/stores/settings';
import { setDraft, useDraft } from '@/lib/sylla/stores/drafts';

interface ChatComposerProps {
  /** Draft-persistence key ('draft' for a new conversation). */
  draftKey: string;
  onSend: (text: string, files?: FileUIPart[]) => void;
  onStop?: () => void;
  streaming: boolean;
  disabled: boolean;
  hint?: string;
  /**
   * Supplementary-only guidance — the server is the real enforcement point.
   * Used to show a character counter and to disable file attachment for
   * anonymous users.
   */
  maxChars: number;
  isAuthenticated: boolean;
}

const ACCEPTED_FILE_EXTENSIONS = '.pdf,.txt,application/pdf,text/plain';

/**
 * Multiline chat composer. Send with Enter (Shift+Enter = newline) or, when
 * "Enter sends" is off in settings, with Cmd/Ctrl+Enter. Drafts persist per
 * conversation so navigation doesn't eat typed input.
 *
 * The character limit and file-attach gating here are UX hints only — every
 * limit is re-checked and enforced server-side in /api/sylla/chat.
 */
export function ChatComposer({
  draftKey,
  onSend,
  onStop,
  streaming,
  disabled,
  hint,
  maxChars,
  isAuthenticated,
}: ChatComposerProps) {
  const value = useDraft(draftKey);
  const { sendOnEnter } = useSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const [attachedFile, setAttachedFile] = useState<FileUIPart | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const overLimit = value.length > maxChars;

  // Re-fit height when the draft is restored or cleared externally.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || disabled || streaming || overLimit) return;
    setDraft(draftKey, '');
    const files = attachedFile ? [attachedFile] : undefined;
    setAttachedFile(null);
    onSend(text, files);
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setFileError(null);

    const acceptedTypes: readonly string[] = UPLOAD_LIMITS.acceptedMediaTypes;
    if (!acceptedTypes.includes(file.type)) {
      setFileError('Only PDF and .txt files are supported.');
      return;
    }
    if (file.size > UPLOAD_LIMITS.maxFileBytes) {
      const maxMb = (UPLOAD_LIMITS.maxFileBytes / (1024 * 1024)).toFixed(0);
      setFileError(`File is too large — the limit is ${maxMb} MB.`);
      return;
    }

    const [part] = await convertFileListToFileUIParts(event.target.files ?? undefined);
    setAttachedFile(part ?? null);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs">
          <Paperclip size={12} aria-hidden className="shrink-0 text-faint" />
          <span className="min-w-0 flex-1 truncate">{attachedFile.filename ?? 'Attached file'}</span>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            aria-label="Remove attached file"
            className="shrink-0 rounded p-0.5 text-faint hover:bg-hover hover:text-foreground"
          >
            <X size={13} aria-hidden />
          </button>
        </div>
      )}
      {fileError && (
        <p role="alert" className="mb-2 text-xs text-destructive">
          {fileError}
        </p>
      )}
      <div className="flex items-end gap-2 rounded-xl border border-border bg-input-bg p-2 shadow-mq-sm focus-within:border-primary">
        <label htmlFor={fileInputId} className="sr-only">
          Attach a file
        </label>
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_EXTENSIONS}
          className="hidden"
          disabled={!isAuthenticated || disabled}
          onChange={(event) => void handleFileChange(event)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isAuthenticated || disabled || Boolean(attachedFile)}
          aria-label={isAuthenticated ? 'Attach a PDF or text file' : 'Sign in to attach files'}
          title={isAuthenticated ? 'Attach a PDF or text file' : 'Sign in to attach files'}
          className="mb-1 shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Paperclip size={16} aria-hidden />
        </button>
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
          aria-invalid={overLimit}
          className="max-h-[160px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:opacity-50"
        />
        {streaming && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-destructive hover:text-destructive"
          >
            <Square size={14} aria-hidden /> Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || streaming || value.trim().length === 0 || overLimit}
            aria-label="Send message"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizonal size={14} aria-hidden /> Send
          </button>
        )}
      </div>
      <p className="mt-2 min-h-4 text-center text-xs text-faint" aria-live="polite">
        {overLimit ? (
          <span className="text-destructive">
            {value.length - maxChars} characters over the {maxChars.toLocaleString()}-character limit
          </span>
        ) : (
          hint ?? (sendOnEnter ? 'Enter to send · Shift+Enter for a new line' : 'Cmd/Ctrl+Enter to send')
        )}
      </p>
    </form>
  );
}
